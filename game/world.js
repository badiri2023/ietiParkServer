class World {
    //tamaño del mapa
    constructor() {
        // Aseguramos que sea un array para evitar el error "is not iterable"
        this.width = 700;
        this.height = 500;
        this.obstacles = [
            { x: 200, y: 300, width: 200, height: 20 },
            { x: 400, y: 150, width: 50, height: 200 }
        ];
        
        this.door = { x: 600, y: 400, width: 50, height: 50 };
    }
}
module.exports = World;