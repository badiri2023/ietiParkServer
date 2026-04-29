# PICO4


## MONGO_db
**Comandos para levantar MONGOdb**

*Usaremos estos comandos antes de ejecutar el servidor*

- sudo systemctl start mongod

comprobamos si inicio 
- sudo systemctl status mongod

comprobamos si esta vivo mongobd

- mongosh


**Comandos para consultar la base de datos**
*Esto lo pondremos cuando aparezca test>*

Ejecutamos en terminal:

- mongosh

*Consultar base de datos*
- show dbs
- use pico4_db
- show collections

*ejemplo consulta colecciones*
- db.jugadors.find().pretty()
- db.partides.find().pretty()