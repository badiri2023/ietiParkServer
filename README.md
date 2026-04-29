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



## Comandos para redirigir wss

**1.Redirigir el tràfic extern entrant del port 80 cap al 3000** 

- sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000 

**2. Redirigir el tràfic intern (localhost) del port 80 cap al 3000**
- sudo iptables -t nat -A OUTPUT -o lo -p tcp --dport 80 -j REDIRECT --to-port 3000 

**3. Acceptar el tràfic entrant al port 3000 (ja que la redirecció es fa abans de filtrar)**
- sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT

**4. Acceptar el tràfic entrant al port 80 (per assegurar la connexió inicial)**
- sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT