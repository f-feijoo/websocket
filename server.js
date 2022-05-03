const express = require('express')
const productos = require('./routes/productos.js')
const multer = require('multer')
const fs = require('fs')
const http = require('http')

const app = express()
const server = http.createServer(app)

app.set('views', './views')
app.set('view engine', 'ejs')

const {Server} =require('socket.io')
const moment = require('moment')
const io = new Server(server)

app.use(express.static(__dirname+'/public'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use('/api', productos)

let storage = multer.diskStorage({
    destination:function(req, file, cb){
        cb(null, 'uploads')
    },
    filename:function(req, file, cb){
        cb(null, file.originalname)
    }
})

let prod = []

let upload = multer({storage})

const PORT = process.env.PORT || 8080

io.on('connection', (socket) => {
    fs.readFile(`./productos.json`, 'utf-8', (err, data) => {
        if (err) {
            return({message: 'Error en la consulta'})
        }else{
            socket.emit('productos', JSON.parse(data))
            socket.on('dataMsn', (x) => {
                fs.readFile(`./productos.json`, 'utf-8', (err, data) => {
                    if (err) {
                        return({message: 'Error en la lectura'})
                    }else{
                        let arr = JSON.parse(data)
                        let ind = arr[arr.length - 1]['id'] + 1
                        const {title, price, thumbnail} = x
                        let productoNuevo = {
                        title: title,
                        price: price,
                        thumbnail: thumbnail,
                        id: ind
                        }
                        arr.push(productoNuevo)
                        fs.writeFile('./productos.json', JSON.stringify(arr), 'utf-8', (err) => {
                            if(err){
                                return 'Error al escribir'
                            } else {
                               console.log('Cargado')
                            }
                        } )
                            }
                })
                io.sockets.emit('productos', JSON.parse(data)) // Para que varias instancias de la pagina escuchen la respuesta/actualizacion
            })
        }
    })
    fs.readFile(`./mensajes.json`, 'utf-8', (err, data) => {
        if (err) {
            return({message: 'Error en la consulta'})
        }else{
            socket.emit('mensajes', JSON.parse(data))
            socket.on('Msn', (x) => {
                fs.readFile(`./mensajes.json`, 'utf-8', (err, data) => {
                    if (err) {
                        return({message: 'Error en la lectura'})
                    }else{
                        let arr = JSON.parse(data)
                        const {user, ms} = x
                        let productoNuevo = {
                            user: user,
                            time: moment().format('DD/MM/YYYY hh:mm:ss'),
                            ms: ms,
                        }
                        arr.push(productoNuevo)
                        fs.writeFile('./mensajes.json', JSON.stringify(arr), 'utf-8', (err) => {
                            if(err){
                                return 'Error al escribir'
                            } else {
                               console.log('Cargado')
                            }
                        } )
                            }
                })
                io.sockets.emit('mensajes', JSON.parse(data)) // Para que varias instancias de la pagina escuchen la respuesta/actualizacion
            })
        }
    })
})

app.get('/', (req, res) => {
    fs.readFile(`./productos.json`, 'utf-8', (err, data) => {
        if (err) {
            return({message: 'Error en la consulta'})
        }else{
            res.render('index', {data: JSON.parse(data)})
        }
    })
})

app.post("/", upload.none(), (req, res) => {
    fs.readFile(`./productos.json`, 'utf-8', (err, data) => {
        if (err) {
            return({message: 'Error en la lectura'})
        }else{
            let arr = JSON.parse(data)
            let ind = arr[arr.length - 1]['id'] + 1
            const {title, price, thumbnail} = req.body
            let productoNuevo = {
            title: title,
            price: price,
            thumbnail: thumbnail,
            id: ind
            }
            arr.push(productoNuevo)
            fs.writeFile('./productos.json', JSON.stringify(arr), 'utf-8', (err) => {
                if(err){
                    return 'Error al escribir'
                } else {
                   console.log('Cargado')
                }
            } )
                }
    })
})

server.listen(PORT, () => {
    console.log(`Servidor http creado con express escuchando en el puerto ${PORT}`)
})

