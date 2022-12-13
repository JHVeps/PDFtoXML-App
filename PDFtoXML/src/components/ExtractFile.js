import React, { useState } from "react";
import { computerVision } from "../OCR/computerVision.js";

/* 
Extract-nappi komponentti
*/

/* 
-Parametrin tähän komponenttiin tulee pdf-tiedosto
*/
export default function ExtractFile({
  pdfFile,
  jsonToDownloadButton,
  dataLoading,
}) {
  const [isLoading, setLoading] = useState(false);
  /* 
  
  -Kun Extract-nappia painetaan, tullaan tähän
  -Jos pdfFile-parametri sisältää dataa eikä ole 'undefined', lähetetään pdfFile computerVision tiedostoon ja otetaan palautunut data Azuresta talteen
  */
  const extract = async () => {
    if (pdfFile) {
      // ComputerVision ---->
      setLoading(true);
      dataLoading(true);
      const data = await computerVision(pdfFile)
        .then((data) => data.readResults[0].lines)
        .catch((err) => console.log("Virhe hakiessa Azuresta:", err));
      setLoading(false);
      dataLoading(false);
      parseArray(data);
    }
  };

  /* 
  Erottelee Azuren palauttamasta datasta sanat, ja luo JSON-objektin näillä tiedoilla.
  Sanan sijainti dokumentissa on selvitetty Azuren palauttaman datan "boundingBox" tietoa hyödyntämällä.
  Sanan sijainti selvitetään siksi, että mikä tahansa kohta lomakkeessa voi olla tyhjä "otsikoita" lukuunottamatta ja on tarpeen selvittää,
  mihin kenttään sana oikeasti kuuluu.
  */
  const parseArray = (data) => {
    //JSON rakenne
    let Tarjous = {
      asiakas: {
        nimi: "",
        osoite1: "",
        osoite2: "",
        postinroJaToimipaikka: "",
        maa: "",
      },
      tarjous: {
        tarjousnro: "",
        paivays: "",
        voimassa: "",
        maksuehto: "",
        toimitustapa: "",
        toimitusehto: "",
        myyja: "",
        viitteenne: "",
        viitteemme: "",
        toimituspvm: "",
      },

      rivit: {},
      summa: {
        verotonYhteensa: "",
      },
    };

    const tarjouksenKentat = [
      "Voimassa",
      "Maksuehto",
      "Toimitustapa",
      "Toimitusehto",
      "Myyjä",
      "Viitteenne",
      "Viitteemme",
      "Toimituspvm",
    ];

    // Poimitaan ensin tarjouksen numero ja päiväys
    // Sanojen sijainnit dokumentissa x-akselilla
    let currentX;
    let nextX;
    for (let i in data) {
      // Kun tullaan otsikkoon "Numero", pitäisi numeron sijaita tasan kahden indeksin päässä
      // Jos data ei sijaitse Numero otsikon alapuolella, asetetaan kenttä tyhjäksi
      if (data[i].text === "Numero") {
        const numero = data[parseInt(i) + 2].text;
        currentX = data[i].boundingBox[2];
        nextX = data[parseInt(i) + 2].boundingBox[0];

        if (nextX > currentX) Tarjous.tarjous.tarjousnro = "";
        else Tarjous.tarjous.tarjousnro = numero;
      }

      // Tullaan otsikkoon "Päiväys"
      // Päiväyksen pitäisi olla kahden indeksin päässä, mutta jos tarjousnro -kenttä oli tyhjä, voi se olla myös seuraavassa indeksissä
      if (data[i].text === "Päiväys") {
        currentX = data[i].boundingBox[0];
        // Jos tarjousnro -kenttä on täytetty, pitäisi päiväyksen löytyä kahden indeksin päästä, jos ei, tutkitaan seuraavaa inteksiä
        // Jos sana ei sijaitse Päiväys otsikon alapuolella, asetetaan kenttä tyhjäksi
        if (Tarjous.tarjous.tarjousnro !== "") {
          nextX = data[parseInt(i) + 2].boundingBox[2];
          if (nextX > currentX)
            Tarjous.tarjous.paivays = data[parseInt(i) + 2].text;
          else Tarjous.tarjous.paivays = "";
        } else {
          nextX = data[parseInt(i) + 1].boundingBox[2];
          if (nextX > currentX)
            Tarjous.tarjous.paivays = data[parseInt(i) + 1].text;
          else Tarjous.tarjous.paivays = "";
        }

        break;
      }
    }

    // Käydään tarjouksen kentät läpi
    // j on indeksi tarjouksenKentat -arrayn läpikäymiseen
    let j = 0;

    for (const i in data) {
      const text = data[i].text;
      const nextIndex = parseInt(i) + 1;

      if (nextIndex >= data.length) break;

      // nykyisen ja seuraavan sanan sijainti x ja y akselilla
      const currentX = data[i].boundingBox[2];
      const currentY = data[i].boundingBox[7];
      const nextX = data[nextIndex].boundingBox[2];
      const nextY = data[nextIndex].boundingBox[7];

      // Pysähdytään sanaan "Toimituspvm"
      if (text === "Toimituspvm") {
        // Jos seuraava sana sijaitsee nykyisen sanan oikealla puolella eikä ole y akselilla liian alhaalla (+0.5 antaa vähän pelivaraa), on seuraava sana Toimituspvm, muuten se on tyhjä.
        if (nextX > currentX && nextY < currentY + 0.5) {
          Tarjous.tarjous.toimituspvm = data[nextIndex].text;
        } else {
          Tarjous.tarjous.toimituspvm = "";
        }
      }

      // Pysähdytään sanaan "Veroton yhteensä"
      if (text === "Veroton yhteensä" || text === "Veroton yhteensa") {
        // Jos seuraava sana sijaitsee nykyisen sanan oikealla puolella eikä ole y akselilla liian alhaalla (+0.5 antaa vähän pelivaraa), on seuraava sana Veroton summa, muuten se on tyhjä.
        if (nextX > currentX && nextY < currentY + 0.5) {
          Tarjous.summa.verotonYhteensa = data[nextIndex].text;
        } else {
          Tarjous.summa.verotonYhteensa = "";
        }
        // Kaikki tarvittavat tiedot on haettu ja voidaan lopettaa
        break;
      }

      // Jos teksti on sama kuin tajouksenKentat arrayn läpikäytävä sana
      if (text === tarjouksenKentat[j]) {
        // Edellisen sanan sijainti x-akselilla
        const prevX = data[parseInt(i) - 1].boundingBox[2];

        // 'Voimassa' sanaa pitäisi edeltää asiakkaan nimi. Jos 'Voimassa' sanan vasemmalla puolella on sana, on se asiakkaan nimi
        if (text === "Voimassa" && prevX < currentX) {
          Tarjous.asiakas.nimi = data[parseInt(i) - 1].text;
        }
        // Jos edeltävä sana ei ole "Voimassa" sanan vasemmalla puolella, ei edellinen sana ole asiakkaan nimi ja asiakkaan nimi laitetaan tyhjäksi
        else if (text === "Voimassa" && prevX >= currentX) {
          Tarjous.asiakas.nimi = "";
        }
        // Jos edellinen sana on vasemmalla puolella eikä se ole edellinen tarjouksen kenttä, on edellinen sana asiakkaan tieto. Muuten asiakkaan tieto tyhjäksi
        else if (
          data[parseInt(i) - 1].text !== tarjouksenKentat[j - 1] &&
          prevX < currentX
        ) {
          Tarjous.asiakas[Object.keys(Tarjous.asiakas)[j]] =
            data[parseInt(i) - 1].text;
        }
        if (
          data[nextIndex].text !== tarjouksenKentat[j + 1] &&
          nextX > currentX
        ) {
          // Jos seuraava sana sijaitsee nykyisen sanan oikealla puolella eikä seuraava sana ole seuraavan kentän nimi, on seuraava sana nykyisen kentän tieto
          // Muuten se on tyhjä
          // Object keys on taulukko Tarjous.tarjous objektin avaimista
          // Haetaan aina tarvittava avain. indeksinä j+2 koska kaksi ensimmäistä avainta 'tarjousnro' ja 'paivays' sisältää jo tietoa ja pitää aloittaa avaimesta 'voimassa'
          // Avain muuttuu joka kierroksella -> voimassa, maksuehto, toimitustapa...
          // Lopulta tämä on siis aina muotoa Tarjous.tarjous.voimassa = data -> Tarjous.tarjous.maksuehto = data... jne.
          Tarjous.tarjous[Object.keys(Tarjous.tarjous)[j + 2]] =
            data[nextIndex].text;
        } else {
          Tarjous.tarjous[Object.keys(Tarjous.tarjous)[j + 2]] = "";
        }
        j++;
      }
    }

    // Tarjouksen rivit
    const lines = parseLines(data);
    Tarjous.rivit = lines;

    // Lähettää Tarjous objektin ylöspäin HomePage komponentille ja sieltä DownloadFile-komponentille
    jsonToDownloadButton(Tarjous);
  };

  /* 
   Erottelee tarjouksen rivit
   Tämä koodi etsii sanojen joukosta sanan "Summa"
   Sen jälkeen kaikki listan elementit on tarjouksen riveihin liittyvää dataa kunnes tulee vastaan sanat "Veroton yhteensä" 
   */
  const parseLines = (dataArray) => {
    const columnBoundaries = {
      pos: [],
      koodi: [],
      nimike: [],
      maara: [],
      aHinta: [],
      ale: [],
      summa: [],
    };

    // Indeksi, josta alkaa ensimmäinen rivi
    let firstLineIndex = 0;
    // Kun löydetään teksti "Summa" sanojen joukosta, seuraavasta indeksistä alkaa tilauksen ensimmäinen rivi
    let boundingLeft;
    let boundingRight;
    for (const i in dataArray) {
      const text = dataArray[i].text;
      if (text === "Pos") {
        let j = parseInt(i);
        let index = 0;

        // Lisätään columnBoundaries objektiin sarakkeille vasen ja oikea reuna, joiden sisällä tiedon täytyy sijaita x-akselilla
        // Vasen reuna on sarakkeen kentän vasen reuna - 0.5 tuumaa. Oikea reuna on viereisen sarakkeen vasen reuna
        while (index < 7) {
          boundingLeft = dataArray[j].boundingBox[0] - 0.5;
          boundingRight = dataArray[j + 1].boundingBox[0];

          // Jos ollaan summa-sarakkeessa, ei oteta seuraavan sarakkeen vasenta reunaa merkiksi vaan luodaan sarakkeelle oikea reuna
          if (boundingLeft > boundingRight)
            boundingRight = dataArray[j].boundingBox[2] + 1;

          columnBoundaries[Object.keys(columnBoundaries)[index]].push(
            boundingLeft
          );
          columnBoundaries[Object.keys(columnBoundaries)[index]].push(
            boundingRight
          );
          j++;
          index++;
        }
      }

      // Kun löytyy sana "Summa", ensimmäinen rivi alkaa seuraavasta indeksistä
      if (text === "Summa") {
        firstLineIndex = parseInt(i) + 1;
        break;
      }
    }

    // Tähän lisätään kaikki rivit ja tämä palautetaan lopuksi
    const lines = [];

    // rivien avaimet (key), sekä myös rivien sarakkeet
    const lineKeys = [
      "pos",
      "koodi",
      "nimike",
      "maara",
      "aHinta",
      "ale",
      "summa",
    ];

    // selkeyden vuoksi toisen niminen muuttuja
    let i = firstLineIndex;
    let j = i;
    // Loopataan niin kauan kunnes tulee vastaan teksti "Veroton yhteensä"
    // j < dataArray.length sen takia toiston ehtona, että jos käännetty teksti ei syystä tai toisesta vastaa tämän koodin ehtoja,
    // niin tämä looppi loppuu viimeistään kun dataArray on käyty kokonaan läpi eikä jää silmukkaan
    while (j < dataArray.length) {
      // Alustetaan tyhjä objekti
      let line = {};
      // Parilla testitiedostolla azure luki ä:n a:na, siksi tämä..
      if (
        dataArray[i].text === "Veroton yhteensä" ||
        dataArray[i].text === "Veroton yhteensa"
      )
        break;

      // Käydään läpi kaikki rivin sarakkeet ja lisätään line-objektiin key-value pareja. Tämä lisää aina line-objektiin uuden avaimen ja sille arvon
      for (const j in lineKeys) {
        if (
          dataArray[i].text === "Veroton yhteensä" ||
          dataArray[i].text === "Veroton yhteensa"
        )
          break;

        // Jos sana on sarakkeen sisällä, lisätään sana sarakkeen tiedoksi
        if (
          dataArray[i].boundingBox[0] > columnBoundaries[lineKeys[j]][0] &&
          dataArray[i].boundingBox[2] < columnBoundaries[lineKeys[j]][1]
        ) {
          line[lineKeys[j]] = dataArray[i].text;
          i++;
        } else {
          line[lineKeys[j]] = "";
        }
      }
      j++;
      // lisätään rivi lines-taulukkoon
      lines.push(line);
    }

    return lines;
  };

  return (
    <div className="text-center">
      <button className="btn-primary upload-button mb-2" onClick={extract}>
        Muunna tiedosto
      </button>
      {isLoading && (
        <div className="spinner-container">
          <div
            className="spinner-border text-primary w-100 h-100"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
