class World {
    //tamaño del mapa
    constructor() {
        // Aseguramos que sea un array para evitar el error "is not iterable"
        this.width = 800;
        this.height = 500;
        this.obstacles = [
            { x: 200, y: 300, width: 200, height: 20 },
            { x: 400, y: 150, width: 50, height: 200 }
        ];
        
        this.door = { x: 618, y: 280, width: 266, height: 310 };
        //this.key = {}
    }
}
module.exports = World;