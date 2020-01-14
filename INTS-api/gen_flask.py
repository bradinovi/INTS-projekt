#!flask/bin/python
from flask import Flask, make_response, request, Response
import genalg
import pprint
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/api/v1.0/raspored', methods=['POST'])
def create_task():
    if not request.json:
        abort(400)
    try:
        pprint.pprint(request.json)
        ulazni_podaci, generacije = genalg.glavna_funk(
            request.json, write_to_file=False)
        rez = genalg.json_rez(generacije['best'], ulazni_podaci)

        return Response(rez, mimetype='application/json; charset=utf-8')
    except:
        abort(500)


if __name__ == '__main__':
    app.run()
