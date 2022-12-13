import React, { useState } from "react";
//pdfFile
const DownloadFile = ({ jsonObject, dataLoading }) => {
  //Loading
  const [isLoading, setLoading] = useState(false);

  //muutetaan json stringiksi
  const dataJson = JSON.stringify(jsonObject, null, "\t");

  const downloadFile = () => {
    //paina download nappi eli loading is true
    setLoading(true);
    dataLoading(true);
    //muutetaan jsonObject js object
    const js = JSON.parse(dataJson);

    //ladattu kirjasto: npm install --save xml-js
    //käännetään js objecti -> xml
    var convert = require("xml-js");
    var options = { compact: true, ignoreComment: true, spaces: 4 };
    const xmlResult = { Myyntitilaus: js };
    var resultXml = convert.js2xml(xmlResult, options); // to convert javascript object to xml text

    //tallennetaan xml xml.tiedostona
    const element = document.createElement("a");

    const textFile = new Blob([resultXml], {
      type: "application/xml",
    });

    element.href = URL.createObjectURL(textFile);
    element.download = "myyntitilaus.xml";
    document.body.appendChild(element);
    element.click();
    //Download valmis loading is false
    setTimeout(() => {
      setLoading(false);
      dataLoading(false);
    }, 100);
  };

  return (
    <div className="downloadFile mb-2 text-center">
      <button
        className="btn-primary download-button mb-2"
        onClick={downloadFile}
      >
        Tallenna koneelle
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
};
export default DownloadFile;
