export class Utilisateur {
    private idAgent : number ;
    private username : String;
    private password : String; 
    private role : String;

    constructor( idAgent : number,username : String,password : String ,role : String) {
        this.idAgent=idAgent;
        this.username= username;
        this.password=password;
        this.role= role;
    }
}