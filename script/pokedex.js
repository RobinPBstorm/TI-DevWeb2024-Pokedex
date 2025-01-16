class pokedex {

  constructor(){
    this.idActuel = 1;
    this.textDescriptions = [];
    this.indexDescription = 0;
    this.estEnChargement = false;
    this.premiereInitialisation = true;

    this.ajouterControlBouton();
    this.getPokemon();
  }

  ajouterControlBouton(){
    const gauche = document.getElementById("flecheGauche");
    const droite = document.getElementById("flecheDroite");

    gauche.addEventListener("click", () => {
      monPokedex.pokemonPrecedent();
    });
    droite.addEventListener("click", () => {
      monPokedex.pokemonSuivant();
    });
  }
  async getPokemon() {
    this.setChargementEncours(true);

    let result = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${this.idActuel - 1}&limit=1`);
    console.log(result);
    let data = await result.json();
    if (data) {
      this.visibiliteElement("flecheGauche", data.previous != null);
      if (data.previous != null) {
        this.dessinerFleche(`https://pokeapi.co/api/v2/pokemon/${this.idActuel - 1}`,true);
      }
      this.visibiliteElement("flecheDroite", data.next != null);
      if (data.next != null) {
        this.dessinerFleche(`https://pokeapi.co/api/v2/pokemon/${this.idActuel + 1}`,false);
      }

      let subResult = await fetch(data.results[0].url);
      let subData = await subResult.json();
      
      if (subData) {
        this._constructionInformation(subData);
      } else {
        this.setChargementEncours(false);
      }
    }
  }

  async _constructionInformation(data) {
    const nomPokemon = document.getElementById("nomPokemon");
    nomPokemon.innerText = data.name;
    if (this.premiereInitialisation) {
      nomPokemon.addEventListener("click", function() {
        monPokedex.pokemonAleatoire(monPokedex);
      });
    }

    const espaceImage = document.getElementById("imagePokemon");
    this.nettoyerElement("imagePokemon");
    const imagePokemon = document.createElement("img");
    imagePokemon.src = data.sprites.front_default;
    espaceImage.appendChild(imagePokemon);

    const espaceInformation = document.getElementById("informationPokemon");
    this.nettoyerElement("informationPokemon");

    espaceInformation.appendChild(
      this.creerLigneInformation(
        this.creerInformation("Taille",(data.height/10)+" m"),
        this.creerInformation("Poids",(data.weight/10)+" kg")));
    let damage_relations = [];
    let index = 1;
    let noeudType = [];
    for (const value of data.types) {
      const typeRequete = await fetch(value.type.url);
      const typeData = await typeRequete.json();

      noeudType.push(this.creerInformation(`Type${index++}`,typeData.names.filter((nomType) => nomType.language.name == "fr")[0].name));
      if (damage_relations.length == 0) {
        damage_relations = typeData.damage_relations;
      } else {
        for (const category in typeData.damage_relations) {
          for(const type of typeData.damage_relations[category]) {

            switch(category) {
              case "double_damage_from":
                this.ajouterResistanceFaiblesse(damage_relations, type, "double_damage_from", "half_damage_from");
                break;
              case "double_damage_to":
                this.ajouterResistanceFaiblesse(damage_relations, type, "double_damage_to", "half_damage_to");
                break;
              case "half_damage_from":
                this.ajouterResistanceFaiblesse(damage_relations, type, "half_damage_from", "double_damage_from");
                break;
              case "half_damage_to":
                this.ajouterResistanceFaiblesse(damage_relations, type, "half_damage_to", "double_damage_to");
                break;
              case "no_damage_from":
              case "no_damage_to":
                damage_relations[category].push(typeData.damage_relations[category]);
                break;
            }
          }
        }
      }

    }
    if(noeudType.length > 1) {
      espaceInformation.appendChild(this.creerLigneInformation(noeudType[0],noeudType[1]));
    } else {
      espaceInformation.appendChild(this.creerLigneInformation(noeudType[0]));
    }

    let noeudFaiblesse = [];
    let noeudForce = [];
    for (const category in damage_relations) {
      for(const type of damage_relations[category].filter(
        (value,index) => damage_relations[category].indexOf(damage_relations[category].find((type)=> type.name == value.name)) === index )
      ) {
        let facteur = 2 * damage_relations[category].filter((typeDansTableau) => typeDansTableau.name == type.name).length;
        switch(category) {
          case "double_damage_from":
            noeudFaiblesse.push(await this.creerInformationType(type.url,`x${facteur}`,"rgb(164, 104, 104)"));
            break;
          case "half_damage_from":
            noeudForce.push(await this.creerInformationType(type.url,`/${facteur}`, "rgb(104, 104, 144)"));
            break;
          case "no_damage_from":
          case "no_damage_to":
            break;
        }
      }
    }
    const faiblesseTitre = document.createElement("h2")
    faiblesseTitre.innerText = "Faiblesse: "
    espaceInformation.appendChild(this.creerLigneInformation(faiblesseTitre));
    espaceInformation.appendChild(this.creerLigneInformation(...noeudFaiblesse));

    const forceTitre = document.createElement("h2")
    forceTitre.innerText = "Résistance: "
    espaceInformation.appendChild(this.creerLigneInformation(forceTitre));
    espaceInformation.appendChild(this.creerLigneInformation(...noeudForce));

    
    const espaceInformationSupplemenaire = document.getElementById("informationSupplementaire");
    this.nettoyerElement("informationSupplementaire");

    let subResult = await fetch(data.species.url);
    
    let subData = await subResult.json();
    if (subData) {
      const description = document.createElement("p");
      this.textDescriptions = [];
      for (const description of subData.flavor_text_entries) {
        if (description.language.name == 'fr') {
          this.textDescriptions.push(this.nettoyageText(description.flavor_text));
        }
      }
      espaceInformationSupplemenaire.addEventListener("click", function() {
        const description = document.querySelector("#informationSupplementaire p")
        description.innerText = monPokedex.getDescripion(monPokedex);
      });
      description.innerText = this.getDescripion();
      espaceInformationSupplemenaire.appendChild(description);
      if (subData.names && subData.names.filter( (name) => name.language.name == "fr")) {
        nomPokemon.innerText = subData.names.filter( (name) => name.language.name == "fr")[0].name;
      }

      this.setChargementEncours(false);
    } else {
      this.setChargementEncours(false);
    }

    this.premiereInitialisation = false;   
  }
  ajouterResistanceFaiblesse(tableau, type, categoryDepart, categoryOppose) {
    if (tableau[categoryOppose].filter((typeDansTableau) => typeDansTableau.name == type.name).length > 0) {
      tableau[categoryOppose] = tableau[categoryOppose].filter((typeDansTableau) => typeDansTableau.name != type.name)
    } else {
      tableau[categoryDepart].push(type);
    }
  }

  pokemonAleatoire(pokedex = this) {
    pokedex.idActuel = Math.ceil(Math.random() * 1025);

    pokedex.getPokemon();
  }

  pokemonSuivant() {
    this.idActuel += 1;
    
    this.getPokemon();
  }
  pokemonPrecedent() {
    this.idActuel -= 1;

    this.getPokemon();
  }

  async dessinerFleche(url, gauche= true) {
    let fleche;
    if (gauche) {
      fleche = document.getElementById("flecheGauche");
    } else {
      fleche = document.getElementById("flecheDroite");
    }
    let ctx = fleche.getContext("2d");
    
    ctx.clearRect(0, 0, fleche.width, fleche.height);
    ctx.beginPath();
    if (gauche) {
      ctx.moveTo(fleche.width - 5,5);
      ctx.lineTo(5, fleche.height / 2);
      ctx.lineTo(fleche.width - 5,fleche.height - 5);
      ctx.lineTo(fleche.width - 5,5);
    } else {
      ctx.moveTo(5,5);
      ctx.lineTo(fleche.width - 5, fleche.height / 2);
      ctx.lineTo(5,fleche.height - 5);
      ctx.lineTo(5,5);
    }
    ctx.fillStyle = "rgb(165,225,255)";
    ctx.fill();

    if (url) {
      const maRequete = await fetch(url);
      const data = await maRequete.json();
      const image = document.createElement("img");
      image.src = data.sprites.front_default;

      image.onload = function() {
        ctx.drawImage(image, 
          (fleche.width - (fleche.height *0.8)) * (gauche? 3/4: 1/4), 
          fleche.height * 0.1, 
          fleche.height * 0.8,
          fleche.height * 0.8);
      }
    }
  }
  visibiliteElement(id, rendreVisible = true) {
    const elementACacher = document.getElementById(id);
    if (elementACacher) {
      if (rendreVisible) {
        elementACacher.style.visibility = "visible";
      }
      else{
        elementACacher.style.visibility = "hidden";
      }
    }
  }
  nettoyerElement(id) {
    const element = document.getElementById(id);
    if (element) {
      while (element.lastChild) {
        element.removeChild(element.lastChild);
      }
    }
  }
  nettoyageText(text) {
    text = text.replaceAll("","");
    text = text.replaceAll("\n"," ");
    text = text.replaceAll(".",".\n");
    return text;
  }
  getDescripion(pokedex = this) {

    if (pokedex.textDescriptions.length > 1) {
      let nouvelIndex = -1;
      do {
        nouvelIndex = Math.floor(Math.random() * pokedex.textDescriptions.length);
      } while (nouvelIndex == pokedex.indexDescription && nouvelIndex < 0);
      pokedex.indexDescription = nouvelIndex;

      return pokedex.textDescriptions[pokedex.indexDescription];
    } else {
      return "Nous n'avons pas trouvé de description dans votre langue";
    }
  }
  async creerInformationType(urlType, modificateur, couleurFond = null) {
    let typeId = urlType.split("/")[urlType.split("/").length - 2];
    let image = document.createElement("img");
    image.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${typeId}.png`;

    const canvas = document.createElement("canvas");
    image.onload = function() {
      canvas.width = 70;
      canvas.height = 20;
      const context = canvas.getContext("2d");
      context.beginPath();
      context.moveTo(10, 0);
      context.lineTo(50, 0);
      context.lineTo(50, 20);
      context.lineTo(10, 20);
      context.lineTo(10, 0);
      context.arc(50, 10, 10, 0, 180)
      context.fillStyle = couleurFond ?? "rgb(144, 104, 104)";
      context.fill();
      context.drawImage(image,0,0,51,50,0,0,25,25);
      context.font = "18px Arial";
      context.fillStyle = "white";
      context.fillText(modificateur,33,16);
    }
    return canvas;
  }

  creerInformation(titreInformation, contenuInformation, estSourceImage = false) {
    const divInformation = document.createElement("div");
    divInformation.classList.add("ligneInformation");

      const label = document.createElement("h3");
      label.innerText = titreInformation+": ";
      divInformation.appendChild(label);

    if (!estSourceImage) {
    const contenu = document.createElement("p");
    contenu.innerText = contenuInformation;
    divInformation.appendChild(contenu);
    } else {
      const img = document.createElement("img");
      img.src = contenuInformation;
      divInformation.appendChild(img);
    }

    return divInformation;
  }
  creerLigneInformation(...informations) {
    const divInformation = document.createElement("div");
    divInformation.classList.add("ligneInformation");

    for (const information of informations) {
      divInformation.appendChild(information);
    }
    return divInformation;
  }
  setChargementEncours(valeur) {
    this.estEnChargement = valeur;
    this.enChargement(this.estEnChargement);
  }
  enChargement(estEnChargement) {
    const contenuPokedex = document.getElementById("contenuPokedex");

    if (estEnChargement) {
      contenuPokedex.classList.add("flou");
    } else {
      contenuPokedex.classList.remove("flou");
    }
  }
}
