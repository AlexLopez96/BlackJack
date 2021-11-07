var blackjack = {
    // Propietats 

    //Referencies HTML
    htmlcstand : null, //Stand del crupier
    htmlcpunts : null, //Punts del crupier
    htmlcma : null, //Mà del crupier
    htmljstand : null, //Stand del jugador
    htmljpunts : null, //Punts del jugador
    htmljma : null, //Mà del jugador
    htmljcontrols : null, //Controls del jugador

    //Variables del joc
    deck : [], //Les cartes de la baralla
    crupier : [], //La mà actual del crupier
    jugador : [], //La mà actual del jugador
    cpunts : 0, //Punts del crupier
    jpunts : 0, //Punts del jugadro
    safePoints : 17, //El crupier podrà fer STAND o PASSAR a partir d'aquests punts
    cstand : false, //El crupier esta en STAND
    jstand : false, //El jugador esta en STAND
    turn : 0, //El torn del jugador és 0 i el del crupier és 1

    
    //Funcions

    //Assignació dels elements del la pàgina html al objecte i funcions als botons
    init : function(){
        blackjack.htmlcstand = document.getElementById("deal-stand"); //Estat STAND del crupier
        blackjack.htmlcpunts = document.getElementById("deal-points"); //Punts del crupier
        blackjack.htmlcma = document.getElementById("deal-cards"); //Cartes del crupier
        blackjack.htmljstand = document.getElementById("play-stand"); //Estat STAND del jugador
        blackjack.htmljpunts = document.getElementById("play-points"); //Punts del jugador
        blackjack.htmljma = document.getElementById("play-cards"); //Cartes del jugador
        blackjack.htmljcontrols = document.getElementById("play-control"); 
    
        //Botons
        document.getElementById("playc-start").addEventListener("click", blackjack.start);//Funció start
        document.getElementById("playc-hit").addEventListener("click", blackjack.hit);//Funció hit
        document.getElementById("playc-stand").addEventListener("click", blackjack.stand);//Funcio STAND
    },

    //Inici del joc
    start : function(){
        //Reinici dels atributs
        blackjack.deck = []; blackjack.crupier = []; blackjack.jugador = [];
        blackjack.cpunts = 0; blackjack.jpunts = 0;
        blackjack.cstand = false; blackjack.jstand = false;
        blackjack.htmlcpunts.innerHTML = '?'; blackjack.htmljpunts.innerHTML = 0;
        blackjack.htmlcma.innerHTML = ""; blackjack.htmljma.innerHTML = "";
        blackjack.htmlcstand.classList.remove("stood");//Treure l'estat de STOOD 
        blackjack.htmljstand.classList.remove("stood");
        blackjack.htmljcontrols.classList.add("started")

        //Barrejar la baralla
        //s: Pals de les cartes (0 = CORS, 1 = DIAMANTS, 2 = TREBOL, 3 = PICA)
        //n: nombres (1=AS, 2-10 = CARTES NORMALS, 11 = JACK, 12 = REINA, 13 = REI)
        for (var i=0; i<4; i++) { 
            for (var j=1; j<14; j++) {
                blackjack.deck.push({s : i, n : j}); 
            }
        } 

        //Barreja dels arrays (https://medium.com/@nitinpatel_20236/how-to-shuffle-correctly-shuffle-an-array-in-javascript-15ea3f84bfb)
        for (var i=blackjack.deck.length - 1; i>0; i--) {
            var j = Math.floor(Math.random()*i) //Creeem un RANDOM
            var tmp = blackjack.deck[i] //Creem una variable la qual tindrà el valor actual de deck[i]
            blackjack.deck[i] = blackjack.deck[j] //Canviem el valor del deck[i] per el valor de deck[j]
            blackjack.deck[j] = tmp //Canviem el valor actual de deck[j] per el temporal
        }

        //Assignació de les primeres 4 cartes
        blackjack.turn = 0; blackjack.draw(); blackjack.turn = 1; blackjack.draw();
        blackjack.turn = 0; blackjack.draw(); blackjack.turn = 1; blackjack.draw();
        

        //Comprovació de si ja hi ha guanyador
        blackjack.turn = 0; blackjack.punts();
        blackjack.turn = 1; blackjack.punts();

        var guanyador = blackjack.check();
        if(guanyador==null){blackjack.turn = 0} //Si no hi ha guanyador es torna a començar
    },

    //Agafar cartes del deck
    dpals : ["&hearts;","&diams;", "&clubs;", "&spades;"], //Array amb els icones visuals de cada pal
    dnum : {1 : "A", 11 : "J", 12 : "Q", 13 : "K"}, //Array amb el número equivalent de les cartes que son lletres

    draw : function(){
        //Agafar la carta del deck + afageirla al HTML
        //Es crea una carta agafant-la del array i es crea un div al HTML
        var carta = blackjack.deck.pop(), 
            cardh = document.createElement("div"), //Creació del div on hi ha la carta 
            cardv = (blackjack.dnum[carta.n] ? blackjack.dnum[carta.n] : carta.n) + blackjack.dpals[carta.s]; //Assignació i creació del num i el pal de la carta
        
        cardh.className = "bj-card";
        cardh.innerHTML = cardv; //S'afegeix la carta al div creat anteriorment amb la carta agafada


        //Assignació de qui s'ha de quedar la carta segons qui té el torn
        //La carta del crupier
        if(blackjack.turn){
            if(blackjack.crupier.length==0){
                cardh.id = "deal-first"
                cardh.innerHTML = `<div class="back">?</div><div class="front">${cardv}</div>`;
            }
            blackjack.crupier.push(carta);
            blackjack.htmlcma.appendChild(cardh);
        }else{ //La carta del jugador
            blackjack.jugador.push(carta);
            blackjack.htmljma.appendChild(cardh);
        }
    },


    //Comptador de Punts
    punts : function(){
        aces = 0 //L'AS pot ser o 1 o 11
        punts = 0

        for(var i of(blackjack.turn ? blackjack.crupier : blackjack.jugador)){
            if(i.n == 1){aces++} //Si la carta és un AS es suma +1 a la variable 'aces'
            else if(i>=11 && i<=13){punts+=10} //Si és una carta especial es suma +10 als punts totals
            else{punts += i.n}//Sino es suma el número de la carta
        }

        //Càlcul dels AS
        if(aces!=0){
            var minmax = []
            
            //Per cada AS que hi hagi es multiplica per 11 + els punts totals, es resta de la quantitat d'AS que hi ha i s'afegeix al array 'minmax'
            for (var elevens=0; elevens<=aces; elevens++) { 
                let calc = punts + (elevens * 11) + (aces-elevens * 1); 
                minmax.push(calc); 
            } 

            punts = minmax[0]; 

            for (var i of minmax) { //Per cada component de 'minmax'
                if (i > punts && i <= 21) { 
                    punts = i; //S'agafa el valor més gran i punts passa a ser aquest
                }
            }
        }

        //Actualitzar punts
        if(blackjack.turn){blackjack.cpunts=punts} //S'actualitza la puntuació del crupier
        else{
            blackjack.jpunts = punts //S'actualitza la puntucació del jugador
            blackjack.htmljpunts.innerHTML = punts //S'afegeix al HTML
        }
    },

    //Comprovació de guanyador
    check : function(){
        //Jugador guanyador = 0, croupier guanyador = 1, Empat = 2
        var guanyador = null, missatge = ""

        //Aconseguir un blackjack(21 punts) des de primera ronda
        if(blackjack.jugador.length==2 && blackjack.crupier.length==2){
            //Empat
            if(blackjack.jpunts==21 && blackjack.cpunts==21){
                guanyador = 2, missatge = "Hi ha hagut un empat"
            }
            
            //Guanyador jugador
            if(guanyador == null && blackjack.jpunts==21){
                guanyador = 0, missatge = "El JUGADOR guanya amb un BLACKJACK"
            }

            //Guanyador crupier
            if(guanyador == null && blackjack.cpunts==21){
                guanyador = 1, missatge = "El CRUPIER guanya amb un BLACKJACK"
            }
        }

        //Sobrepassar els 21 punts
        if(guanyador ==null){
            //El jugador es passat
            if(blackjack.jpunts>21){
                guanyador = 1, missatge = "El CRUPIER guanya - JUGADOR s'ha passat de punts"
            }

            //El crupier es passa
            if(blackjack.cpunts>21){
                guanyador = 0, missatge = "El JUGADOR guanya - CRUPIER s'ha passat de punts"
            }
        }

        //Chequeig del guanyador quan els dos jugadors fan STAND
        if(guanyador == null && blackjack.cstand && blackjack.jstand){
            //El crupier té més punts
            if(blackjack.cpunts>blackjack.jpunts){
                guanyador = 1, missatge = "El CRUPIER guanya amb " + blackjack.cpunts + " punts"
            }
            //El jugador té més punts
            else if(blackjack.cpunts<blackjack.jpunts){
                guanyador = 0, missatge = "El JUGADOR guanya amb " + blackjack.jpunts + " punts"
            }
            //Empat
            else{
                guanyador = 3, missatge = "Hi ha hagut un empat"
            }
        }

        //Mostrar el guanyador
        if(guanyador != null){
            //Mostrem la mà del crupier
            blackjack.htmlcpunts.innerHTML = blackjack.cpunts
            document.getElementById("deal-first").classList.add("show");
        

            //Reset de l'interfície
            blackjack.htmljcontrols.classList.remove("started")

            //Mostrar guanyador en una alerta
            alert(missatge)
        }
        return guanyador
    },


    //Demanar carta
    hit : function(){
        //Agafar una nova carta
        blackjack.draw(); blackjack.punts();

        //Auto-STAND al arribar a 21 punts per no poder tirar
        if(blackjack.turn==0 && blackjack.jpunts==21 && !blackjack.jstand){
            blackjack.jstand = true; blackjack.htmljstand.classList.add("stood");
        }
        if(blackjack.turn==1 && blackjack.cpunts==21 && !blackjack.cstand){
            blackjack.cstand = true; blackjack.htmlcstand.classList.add("stood");
        }

        //Continuar la partida en cas de no haver jugador
        var guanyador = blackjack.check()
        if(guanyador == null){blackjack.next()}
    },

    //Funció d'aplicació del estat STAND
    stand : function(){
        //Assignar estat STAND
        if(blackjack.turn){
            blackjack.cstand = true; blackjack.htmlcstand.classList.add("stood");
        }else{
            blackjack.jstand = true; blackjack.htmljstand.classList.add("stood");
        }

        //S'acaba la partida o es segueix?
        var guanyador = (blackjack.jstand && blackjack.cstand) ? blackjack.check() : null
        if(guanyador == null){blackjack.next()}
    },
    

    //Funció de passar torn
    next : function(){
        blackjack.turn = blackjack.turn==0 ? 1 : 0 //Si el torn el te 0 passa a 1 i si el te 1 passa a 0

        //Torn del crupier
        if(blackjack.turn==1){
            if(blackjack.cstand){blackjack.turn = 0} //Si crupier està STAND passa torn
            else{blackjack.ai()}
        }

        //Torn del jugador
        else{blackjack.jstand}{blackjack.turn=0; blackjack.ai()} //Si el jugador està STAND passa torn
    },

    //Funcionament del crupier
    ai : function(){
        if(blackjack.turn){
            if(blackjack.cpunts>=blackjack.safePoints){blackjack.stand()} //En cas d'estar en el rang de seguretat(>=17) fa STAND
            else{blackjack.hit()}//En cas de no estar-hi demana carta
        }
    }
};
window.addEventListener("DOMContentLoaded", blackjack.init); //Inicialització de la funció init