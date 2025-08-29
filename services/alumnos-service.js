export default class AlumnosService {
  constructor() {
    this.alumnos = [];
    this.nextId = 1;
  }

  async getAllAsync() {
    return this.alumnos;
  }

  async getByIdAsync(id) {
    return this.alumnos.find(a => a.id === Number(id)) || null;
  }

  async createAsync(entity) {
    const newId = this.nextId++;
    const nuevo = { id: newId, ...entity };
    this.alumnos.push(nuevo);
    return newId;
  }

  async updateAsync(entity) {
    const index = this.alumnos.findIndex(a => a.id === Number(entity.id));
    if (index >= 0) {
      this.alumnos[index] = { ...this.alumnos[index], ...entity };
      return 1;
    }
    return 0;
  }

  async deleteByIdAsync(id) {
    const index = this.alumnos.findIndex(a => a.id === Number(id));
    if (index >= 0) {
      this.alumnos.splice(index, 1);
      return 1;
    }
    return 0;
  }
}
