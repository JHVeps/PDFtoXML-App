import React from "react";
import { useState } from "react";
import Heading from "./Heading";
import Footer from "./Footer";
//import UploadFile from "./UploadFile";
import ExtractFile from "./ExtractFile";
import Openfile from "./Openfile";
import DownloadFile from "./DownloadFile";
/* 
-Päänäkymä
-Täällä on useState pdf tiedostolle (pdfFile). Täältä sitä pdf-fileä lähetellään komponentin parametrina/propsina muille komponenteille missä sitä tarvitaan.
-Tiedosto valitaan alussa <OpenFile /> komponentissa, josta se välitetään tänne ja asetetaan setPdfFile(pdfData)
-showButtons state määrää näytetäänkö nappi (true) vai eikö sitä näytetä (false)
*/
export default function HomePage() {
  const [pdfFile, setPdfFile] = useState(null);
  // Käännetty JSON objekti joka tulee ExtractFile-komponentista. Tämä lähetetään DownloadFile-komponenttiin jossa se tallennettaan tekstitiedostoon.
  const [jsonObject, setJsonObject] = useState(null);
  const [showButtons, setShowButtons] = useState({
    extractButton: true,
    downloadButton: false,
  });
  const [loading, setLoading] = useState(false);

  /* 
  -Päivitetään valittu pdf uudeksi stateksi
  -Tämä on se funktio mitä kutsutaan kun Openfile.js tiedostossa kutsutaan uploadFile(selectFile), eli selectFile = pdfData.
  -Tähän taas päästään käsiksi tuolla <Openfile uploadFile={updateFileData} funktiokutsulla />
  -Jos pdfData sisältää jotain dataa eikä ole 'undefined', niin asetetaan state setPdfFile(pdfData);
  */
  const updateFileData = (pdfData) => {
    if (pdfData) {
      setPdfFile(pdfData);
      // Jos tiedosto vaihdetaan, tulee taas näkyviin upload-nappi
      setShowButtons({
        extractButton: true,
        downloadButton: false,
      });
    } else console.log("No file");
  };

  const jsonObjectReady = (json) => {
    setJsonObject(json);
    setShowButtons({
      extractButton: false,
      downloadButton: true,
    });
  };

  /* 
  -Tähän on lisäilty kaikki luodut komponentit
  -Nappuloista renderöidään joko upload-nappi tai extract-nappi
  -Alussa näytetään upload-nappi ja kun tiedosto on valittu, näytetään extract-nappi
    */
  return (
    <div className="d-flex align-items-center flex-column mt-5">
      <div style={{ opacity: loading ? 0.7 : 1 }}>
        <Heading />
        <Openfile uploadFile={updateFileData} />
        {showButtons.extractButton && (
          <ExtractFile
            pdfFile={pdfFile}
            jsonToDownloadButton={jsonObjectReady}
            dataLoading={setLoading}
          />
        )}
        {showButtons.downloadButton && (
          <DownloadFile jsonObject={jsonObject} dataLoading={setLoading} />
        )}
        <Footer />
      </div>
    </div>
  );
}
