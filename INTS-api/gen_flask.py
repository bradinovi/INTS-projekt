#!flask/bin/python
from flask import Flask, make_response, request, Response
import genalg
import pprint

app = Flask(__name__)

@app.route('/api/v1.0/raspored', methods=['POST'])
def create_task():
    if not request.json:
        abort(400)
    try:
        ulazni_podaci, generacije = genalg.glavna_funk(request.json, write_to_file=False)
		rez = genalg.json_rez(generacije['best'], ulazni_podaci)
		pprint.pprint(rez)
        return Response(rez, mimetype='application/json; charset=utf-8')
    except:
        abort(500)

if __name__ == '__main__':
    app.run()
