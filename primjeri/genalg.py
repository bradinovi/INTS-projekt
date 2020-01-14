from functools  import partial
from operator   import itemgetter
from itertools  import groupby, tee
from statistics import mean, pstdev, median

import copy, json, random


# logika preuzeta iz DEAP-a (Distributed Evolutionary Algorithms in Python)
class Toolbox:
    def register(self, alias, function, *args, **kargs):
        if hasattr(self, alias):
            self.unregister(alias)
        pfunc = partial(function, *args, **kargs)
        pfunc.__name__ = alias
        pfunc.__doc__ = function.__doc__

        if hasattr(function, "__dict__") and not isinstance(function, type):
            pfunc.__dict__.update(function.__dict__.copy())

        setattr(self, alias, pfunc)

    def unregister(self, alias):
        delattr(self, alias)


class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)


def convert_termini(podaci_preferencija):
    ranged = lambda x, *y: range(x, y[0] + 1) if y else range(x, x + 1)
    for odabir in podaci_preferencija:
        if 'odabir' in odabir and odabir['odabir']:     
            for termin in odabir['odabir']:
                if 'termini' in termin and termin['termini']:
                    termin['termini'] = {i for t in termin['termini'] for i in ranged(*map(int, t.split('-')))}


def evaluate_chromosome(jedinka, ulazni_podaci):
    jedinka['fit'] = 1000.0
    jedinka['hard_dev'] = 0
    jedinka['soft_dev'] = 0
    jedinka['hard_pos'] = []
    jedinka['soft_pos'] = []
    #print("nova: ", jedinka['fit'])
    #hard restrictions
    for i in range(len(jedinka['jedinka']) - 1):
        for j in range(i + 1, len(jedinka['jedinka'])):
            if (jedinka['jedinka'][i]['dan'] == jedinka['jedinka'][j]['dan'] and
                jedinka['jedinka'][i]['termin'] & jedinka['jedinka'][j]['termin']):
                
                n = []
                if jedinka['jedinka'][i]['profesor'] == jedinka['jedinka'][j]['profesor']:
                    n.append('p')
                if jedinka['jedinka'][i]['dvorana'] == jedinka['jedinka'][j]['dvorana']:
                    n.append('d')
                if jedinka['jedinka'][i]['grupa'] == jedinka['jedinka'][j]['grupa']:
                    n.append('g')
                
                jedinka['hard_dev'] += len(n)
                if n:
                    jedinka['fit'] -= (0.9**len(n)) * jedinka['fit']
                    jedinka['hard_pos'].append((''.join(n), i, j))
                #print("hard: ", jedinka['fit'])
                
    #soft restrictions
    for e, krom in enumerate(jedinka['jedinka']):
        kolegij = next(filter(lambda k: k['k_id'] == krom['kolegij'], ulazni_podaci['preferencije']['kolegiji']), None)
        if kolegij and kolegij['odabir']:
            for odabir in kolegij['odabir']:
                if 'dvorane' in odabir and odabir['dvorane']:
                    if krom['dvorana'] not in odabir['dvorane']:
                        jedinka['fit'] -= 0.02 * jedinka['fit']
                        jedinka['soft_pos'].append(('k-d', e))
                        jedinka['soft_dev'] += 1
                        #print("soft-kolegij: ", jedinka['fit'])
                if 'termini' in odabir and odabir['termini']:
                    if not krom['termin'] <= odabir['termini']:
                        jedinka['fit'] -= 0.02 * jedinka['fit']
                        jedinka['soft_pos'].append(('k-t', e))
                        jedinka['soft_dev'] += 1
                        #print("soft-kolegij: ", jedinka['fit'])
        profesor = next(filter(lambda k: k['p_id'] == krom['profesor'], ulazni_podaci['preferencije']['profesori']), None)
        if profesor and profesor['odabir']:
            for odabir in profesor['odabir']:
                if 'dan' in odabir and 'termini' in odabir and odabir['termini']:
                    if krom['dan'] == odabir['dan'] and not krom['termin'] <= odabir['termini']:
                        jedinka['fit'] -= 0.01 * jedinka['fit']
                        jedinka['soft_pos'].append(('p-t', e))
                        jedinka['soft_dev'] += 1
                        #print("soft-profesor: ", jedinka['fit'])
    if ('aktivan' in ulazni_podaci['preferencije']['dvorane'] and ulazni_podaci['preferencije']['dvorane']['aktivan']
        and 'popunjenost' in ulazni_podaci['preferencije']['dvorane'] and ulazni_podaci['preferencije']['dvorane']['popunjenost'] > 0.0):
        
        for e, krom in enumerate(jedinka['jedinka']):
            if (ulazni_podaci['grupe'][krom['grupa']]['kapacitet'] / ulazni_podaci['dvorane'][krom['dvorana']]['kapacitet'] <
                ulazni_podaci['preferencije']['dvorane']['popunjenost']):
                    
                jedinka['fit'] -= 0.1 * jedinka['fit']
                jedinka['soft_pos'].append(('d', e))
                jedinka['soft_dev'] += 1
                #print("soft-dvorane: ", jedinka['fit'])
    if ('aktivan' in ulazni_podaci['preferencije']['grupe'] and ulazni_podaci['preferencije']['grupe']['aktivan']
        and 'max_razmak' in ulazni_podaci['preferencije']['grupe'] and ulazni_podaci['preferencije']['grupe']['max_razmak'] >= 0):
            
        for key, value in groupby(sorted(jedinka['jedinka'], key=lambda x: x['dan']), key=itemgetter('dan')):
            value = sorted(value, key=lambda x: min(x['termin']))
            if len(value) > 1:
                for t in range(len(value) - 1):
                    if (value[t]['grupa'] == value[t + 1]['grupa'] and 
                        not value[t]['termin'] & value[t + 1]['termin'] and
                        min(value[t + 1]['termin']) - max(value[t]['termin']) > ulazni_podaci['preferencije']['grupe']['max_razmak']):
                                
                        jedinka['fit'] -= 0.05 * jedinka['fit']
                        jedinka['soft_pos'].append(('g', jedinka['jedinka'].index(value[t]), jedinka['jedinka'].index(value[t + 1])))
                        jedinka['soft_dev'] += 1
                        #print("soft-grupe: ", jedinka['fit'])
    if ('aktivan' in ulazni_podaci['preferencije']['dnevni_limit'] and ulazni_podaci['preferencije']['dnevni_limit']['aktivan'] 
        and ulazni_podaci['preferencije']['dnevni_limit']['limit'] > 0):
        
        for key, value in groupby(sorted(jedinka['jedinka'], key=lambda x: x['dan']), key=itemgetter('dan')):
            p_it1, p_it2 = tee(value, 2)
            if len({t for gen in p_it1 for t in gen['termin']}) > ulazni_podaci['preferencije']['dnevni_limit']['limit']:
                
                jedinka['fit'] -= 0.01 * jedinka['fit']
                jedinka['soft_pos'].append(('l', *map(lambda x: jedinka['jedinka'].index(x), p_it2)))
                jedinka['soft_dev'] += 1
                #print("soft-grupe: ", jedinka['fit'])
    jedinka['validnost'] = True


def create_population(generacija = 0):
    return {'generacija': generacija, 'validnost': False, 'median_fit': 0.0, 'avg_fit': 0.0, 'std_fit': 0.0, 'approved': [], 'all': []}


def initialize_population(ulazni_podaci):
    populacija = create_population()
    if 'n_pop' in ulazni_podaci['parametri']:
        for i in range(ulazni_podaci['parametri']['n_pop']):
            jedinka = {'validnost': False, 'fit': 1000.0, 'hard_dev': 0, 'soft_dev': 0, 'hard_pos': [], 'soft_pos': []}
            genotip = []
            for k, predavanje in ulazni_podaci['nastava'].items():
                gen = {'profesor': predavanje['p_id']}
                gen['kolegij'] = predavanje['k_id']
                gen['grupa'] = predavanje['g_id']
                p_termin = random.choice(ulazni_podaci['termini'][:len(ulazni_podaci['termini']) - predavanje['trajanje'] + 1])
                gen['termin'] = {*range(p_termin, p_termin + predavanje['trajanje'])}
                gen['dan'] = random.choice(ulazni_podaci['dani'])
                p_dvorane = [d['id'] for d in ulazni_podaci['dvorane'].values()
                             if d['spec'] & predavanje['dvorana'] and d['kapacitet'] >= ulazni_podaci['grupe'][predavanje['g_id']]['kapacitet']]
                gen['dvorana'] = random.choice(p_dvorane)
                genotip.append(gen)
            jedinka['jedinka'] = genotip
            populacija['all'].append(jedinka)
    evaluate_population(populacija, ulazni_podaci)
    return populacija


def copy_chromosome(jedinka):
    nova = copy.deepcopy(jedinka)
    nova['fit'] = 1000.0
    nova['hard_dev'] = 0
    nova['soft_dev'] = 0
    nova['hard_pos'] = []
    nova['soft_pos'] = []
    nova['validnost'] = False
    return nova


def evaluate_population(populacija, ulazni_podaci):
    for krom in populacija['all']:
        evaluate_chromosome(krom, ulazni_podaci)
    jedinka_fit = [krom['fit'] for krom in populacija['all']]
    populacija['avg_fit'] = mean(jedinka_fit)
    populacija['median_fit'] = median(jedinka_fit)
    populacija['std_fit'] = pstdev(jedinka_fit)
    populacija['validnost'] = True
    populacija['approved'].extend(sorted(filter(lambda x: not x['hard_dev'], populacija['all']), key=lambda x: x['fit'], reverse=True))


def evaluate_run(generacije, ulazni_podaci):
    jedinka_fit = [krom['fit'] for populacija in generacije['all'] for krom in populacija['all']]
    generacije['avg_fit'] = mean(jedinka_fit)
    generacije['median_fit'] = median(jedinka_fit)
    generacije['std_fit'] = pstdev(jedinka_fit)
    generacije['validnost'] = True
    generacije['best'].extend(sorted([krom for populacija in generacije['all'] 
                                      for krom in populacija['approved']], 
                                     key=lambda x: x['fit'], 
                                     reverse=True)[:ulazni_podaci['parametri']['n_best']])


def provjera_strukture(ulazni_podaci):
    return not ('preferencije' not in ulazni_podaci or 
                'kolegiji' not in ulazni_podaci['preferencije'] or 
                'profesori' not in ulazni_podaci['preferencije'] or 
                'dvorane' not in ulazni_podaci['preferencije'] or 
                'grupe' not in ulazni_podaci['preferencije'] or 
                'termini' not in ulazni_podaci or 'parametri' not in ulazni_podaci or 
                'dani' not in ulazni_podaci or 'dvorane' not in ulazni_podaci or 
                'grupe' not in ulazni_podaci or 'kolegiji' not in ulazni_podaci or 
                'nastava' not in ulazni_podaci or 'nastavnici' not in ulazni_podaci)


def initialize_data(ulazni_podaci, *, encoding='utf-8'):
    if not provjera_strukture(ulazni_podaci): return None
    if ulazni_podaci['preferencije']['kolegiji']:
        convert_termini(ulazni_podaci['preferencije']['kolegiji'])
    if ulazni_podaci['preferencije']['profesori']:
        convert_termini(ulazni_podaci['preferencije']['profesori'])
    for dvorana in ulazni_podaci['dvorane']:
        if 'spec' in dvorana and dvorana['spec']:
            dvorana['spec'] = set(dvorana['spec'])
    for predavanje in ulazni_podaci['nastava']:
        if 'dvorana' in predavanje and predavanje['dvorana']:
            predavanje['dvorana'] = set(predavanje['dvorana'])
    ulazni_podaci['nastava'] = {i:predavanje for i, predavanje in enumerate(ulazni_podaci['nastava'])}
    ulazni_podaci['dvorane'] = {dvorana['id']:dvorana for dvorana in ulazni_podaci['dvorane']}
    ulazni_podaci['grupe'] = {grupa['id']:grupa for grupa in ulazni_podaci['grupe']}
    ulazni_podaci['kolegiji'] = {kolegij['id']:kolegij for kolegij in ulazni_podaci['kolegiji']}
    ulazni_podaci['nastavnici'] = {nastavnik['id']:nastavnik for nastavnik in ulazni_podaci['nastavnici']}
    return ulazni_podaci


def tournament_selection(populacija, *, k=2, n=2):
    if k > len(populacija['all']): return tuple()
    if n > len(populacija['all']): n = len(populacija['all'])
    selected = []
    possible = list(range(len(populacija['all'])))
    for i in range(k):     
        selected.append(max(random.sample(possible, n), key=lambda x: populacija['all'][x]['fit']))
        possible.remove(selected[-1])
    return tuple(populacija['all'][r] for r in selected)


def uniform_crossover(roditelji, *, p_cross):
    if len(roditelji) > 2: return tuple()
    child1, child2 = copy_chromosome(roditelji[0]), copy_chromosome(roditelji[1])
    for i in range(min(len(roditelji[0]['jedinka']), len(roditelji[1]['jedinka']))):
        if random.random() < p_cross:
            child1['jedinka'][i], child2['jedinka'][i] = child2['jedinka'][i], child1['jedinka'][i]
    return child1, child2


def odabir_termina(jedinka, ulazni_podaci, indexs, rem_ind, svi_termini):
    # akumulativna pravila
    # hard restrictions
    dani = [{i: set() for i in ulazni_podaci['dani']}]
    for i in indexs:
        dani[0][jedinka['jedinka'][i]['dan']].update(jedinka['jedinka'][i]['termin'])
    for key in dani[0]:
        dani[0][key] = svi_termini[key] - dani[0][key]
    # sljednost termina istih grupa
    dani.append(copy.deepcopy(dani[-1]))
    for i in dani[-1].keys():
        if dani[-1][i]: dani[-1][i] = soft_sljednost(ulazni_podaci['termini'], dani[-1][i],
                                                     duljina=len(jedinka['jedinka'][rem_ind]['termin']),
                                                     max_razmak=ulazni_podaci['preferencije']['grupe'][
                                                         'max_razmak'])

    # preferencije kolegija
    kolegij = next(filter(lambda k: k['k_id'] == jedinka['jedinka'][rem_ind]['kolegij'],
                          ulazni_podaci['preferencije']['kolegiji']), None)
    if kolegij and kolegij['odabir']:
        for odabir in kolegij['odabir']:
            if jedinka['jedinka'][rem_ind]['dvorana'] in odabir['dvorane']:
                dani.append(copy.deepcopy(dani[-1]))
                for d in dani[-1].keys():
                    if dani[-1][d]: dani[-1][d] = dani[-1][d] - (set(ulazni_podaci['termini']) - odabir['termini'])
                break

    # preferencije profesora
    profesor = next(filter(lambda k: k['p_id'] == jedinka['jedinka'][rem_ind]['profesor'],
                           ulazni_podaci['preferencije']['profesori']), None)
    if profesor and profesor['odabir']:
        dani.append(copy.deepcopy(dani[-1]))
        for odabir in profesor['odabir']:
            dani[-1][odabir['dan']] = dani[-1][odabir['dan']] - (set(ulazni_podaci['termini']) - odabir['termini'])

    # dnevni limit predavanja
    dani.append(copy.deepcopy(dani[-1]))
    for d in dani[-1].keys():
        if (dani[-1][d] and
                        len(set(ulazni_podaci['termini']) - dani[0][d]) + len(
                        jedinka['jedinka'][rem_ind]['termin']) >
                    ulazni_podaci['preferencije']['dnevni_limit']['limit']):
            dani[-1][d] = set()
    moguce = set()
    for moguci in dani[::-1]:
        for value in filter(len, moguci.values()):
            moguce = novi_termini(value, duljina=len(jedinka['jedinka'][rem_ind]['termin']))
            if moguce:
                jedinka['jedinka'][rem_ind]['termin'] = random.choice(moguce)
                break
        if moguce: break


def odabir_dvorane(jedinka, ulazni_podaci, indexs, rem_ind):
    dvorane = [d['id'] for d in ulazni_podaci['dvorane'].values()
               if d['spec'] & ulazni_podaci['nastava'][rem_ind]['dvorana'] and
               d['kapacitet'] >= ulazni_podaci['grupe'][jedinka['jedinka'][rem_ind]['grupa']]['kapacitet'] and
               jedinka['jedinka'][rem_ind]['dvorana'] != d['id']]
    p_dvorane = dvorane[:]
    for d in dvorane:
        for i in indexs:
            if (jedinka['jedinka'][i]['dvorana'] == d and
                        jedinka['jedinka'][i]['dan'] == jedinka['jedinka'][rem_ind]['dan'] and
                        jedinka['jedinka'][i]['termin'] & jedinka['jedinka'][rem_ind]['termin']):
                p_dvorane.remove(d)
                break
    #fit dvorana
    pp_dvorane = p_dvorane[:]
    for d in p_dvorane:
        if (ulazni_podaci['grupe'][jedinka['jedinka'][rem_ind]['grupa']]['kapacitet'] / ulazni_podaci['dvorane'][d]['kapacitet'] <
            ulazni_podaci['preferencije']['dvorane']['popunjenost']):
            pp_dvorane.remove(d)

    if pp_dvorane: jedinka['jedinka'][rem_ind]['dvorana'] = random.choice(pp_dvorane)
    elif p_dvorane: jedinka['jedinka'][rem_ind]['dvorana'] = random.choice(p_dvorane)


def hard_opcije(jedinka, ulazni_podaci, dev, svi_termini):
    indexs = [*range(len(jedinka['jedinka']))]
    rem_ind = dev[1] if random.random() < ulazni_podaci['parametri']['mut']['a'] else dev[2]
    indexs.remove(rem_ind)
    if random.random() < ulazni_podaci['parametri']['mut']['b']:
        odabir_termina(jedinka, ulazni_podaci, indexs, rem_ind, svi_termini)
    else:
        odabir_dvorane(jedinka, ulazni_podaci, indexs, rem_ind)


def mutate_chromosome(jedinka, ulazni_podaci):
    if not jedinka['hard_pos'] and not jedinka['soft_pos']: return

    svi_termini = {i: {*range(ulazni_podaci['termini'][0],
                              ulazni_podaci['termini'][0] + ulazni_podaci['termini'][-1])}
                   for i in ulazni_podaci['dani']}
    for dev in jedinka['hard_pos']:
        hard_opcije(jedinka, ulazni_podaci, dev, svi_termini)
    for dev in jedinka['soft_pos']:
        if 'g' in dev:
            hard_opcije(jedinka, ulazni_podaci, dev, svi_termini)
        elif 'd' in dev:
            indexs = [*range(len(jedinka['jedinka']))]
            indexs.remove(dev[1])
            odabir_dvorane(jedinka, ulazni_podaci, indexs, dev[1])
        elif 'k-t' in dev or 'k-d' in dev or 'p-t' in dev:
            indexs = [*range(len(jedinka['jedinka']))]
            indexs.remove(dev[1])
            if random.random() < ulazni_podaci['parametri']['mut']['b']:
                odabir_termina(jedinka, ulazni_podaci, indexs, dev[1], svi_termini)
            else:
                odabir_dvorane(jedinka, ulazni_podaci, indexs, dev[1])
        elif 'l' in dev:
            indexs = [*range(len(jedinka['jedinka']))]
            rem_ind = dev[random.randrange(1, len(dev))]
            indexs.remove(rem_ind)
            if random.random() < ulazni_podaci['parametri']['mut']['b']:
                odabir_termina(jedinka, ulazni_podaci, indexs, rem_ind, svi_termini)
            else:
                odabir_dvorane(jedinka, ulazni_podaci, indexs, rem_ind)


def soft_sljednost(svi, skup, *, duljina, max_razmak):
    dobri = set()
    komplement = set(svi) - skup
    for t in novi_termini(skup, duljina=duljina):
        p = sorted(list(komplement | t))
        if len(p) < 2 or not [i for i in range(1, len(p)) if p[i] - p[i - 1] > max_razmak + 1]:
            dobri.update(t)
    return dobri


def novi_termini(skup, *, duljina):
    if duljina > len(skup): return []
    novi = sorted(list(skup))
    return [{*range(novi[i], duljina + novi[i])} for i in
            [i for i in range(len(novi) - duljina + 1) if novi[i + duljina - 1] - novi[i] == duljina - 1]]


def stop_kriterij(generacije, ulazni_podaci):
    return (len(generacije['all']) == ulazni_podaci['parametri']['max_gen'] 
            or [x for x in generacije['all'][-1]['approved'] if not x['hard_dev'] and x['soft_dev'] < 10])


def glavna_funk(ulaz, write_to_file=False, *, file_name="rezultati.json"):
    ulazni_podaci = initialize_data(ulaz)
    if not ulazni_podaci: return None
    generacije = {'all': [], 'median_fit': 0.0, 'avg_fit': 0.0, 'std_fit': 0.0, 'best': [], 'validnost': False}
    n = 1
    generacije['all'].append(initialize_population(ulazni_podaci))
    print(f"{n:3}. generacija -> population average fit: {generacije['all'][0]['avg_fit']},", 
          f"best chromosome fit: {generacije['all'][0]['approved'][0]['fit'] if generacije['all'][0]['approved'] else None}")
    while not stop_kriterij(generacije, ulazni_podaci):
        populacija = create_population(generacija=n)
        while len(populacija['all']) < ulazni_podaci['parametri']['n_pop']:
            populacija['all'].extend(uniform_crossover(tournament_selection(generacije['all'][-1], 
                                                                      n=ulazni_podaci['parametri']['tournament_size']), 
                                                 p_cross=ulazni_podaci['parametri']['p_cross']))
        if len(populacija['all']) > ulazni_podaci['parametri']['n_pop']: del populacija['all'][random.randrange(len(populacija['all']))]
        for jedinka in populacija['all']:
            mutate_chromosome(jedinka, ulazni_podaci)
        evaluate_population(populacija, ulazni_podaci)
        print(f"{n + 1:3}. generacija -> population average fit: {generacije['all'][-1]['avg_fit']}, ",
              f"best chromosome fit: {generacije['all'][-1]['approved'][0]['fit'] if generacije['all'][-1]['approved'] else None}")
        generacije['all'].append(populacija)
        n += 1
        
    evaluate_run(generacije, ulazni_podaci)
    if write_to_file:
        with open(file_name, 'w', encoding='utf-8') as f:
            json.dump(generacije, f, ensure_ascii=False, indent=4, sort_keys=True, cls=SetEncoder)
            print(f"\nIzlaz zapisan u datoteku '{file_name}'")
    return ulazni_podaci, generacije


def json_rez(naj_rezultati, ulazni_podaci):
    naj_rezultati = copy.deepcopy(naj_rezultati)
    for jedinka in naj_rezultati:
        for gen in jedinka['jedinka']:
            gen['dvorana'] = ulazni_podaci['dvorane'][gen['dvorana']]['naziv']
            gen['grupa'] = ulazni_podaci['grupe'][gen['grupa']]['naziv']
            gen['kolegij'] = ulazni_podaci['kolegiji'][gen['kolegij']]['naziv']
            gen['profesor'] = ulazni_podaci['nastavnici'][gen['profesor']]['preime']
    return json.dumps(naj_rezultati, ensure_ascii=False, sort_keys=True, cls=SetEncoder)
