interface User {
    id: string;
    name: string;
    email: string;
  }
  
  class UserManager {
    private users: User[] = [];
  
    addUser(user: User): void {
      this.users.push(user);
    }
  
    findUser(id: string): User | undefined {
      return this.users.find(user => user.id === id);
    }
  }