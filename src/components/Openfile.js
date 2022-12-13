import React, { useState } from "react";
import { Worker } from "@react-pdf-viewer/core";
// Import the main component
import { Viewer } from "@react-pdf-viewer/core";

// Import the styles
import "@react-pdf-viewer/core/lib/styles/index.css";

/* 
-Tiedoston valinnan komponentti
*/

// uploadFile funktio tässä parametrina on sama kuin <OpenFile uploadFile={} /> parametri tuolla <HomePage /> näkymässä.
const Openfile = ({ uploadFile }) => {
  //hooks
  const [pdfFile, setPdfFile] = useState(null);

  //application/pdf -> requires that fileType is pdf
  const fileType = ["application/pdf"];
  const handleSubmit = (event) => {
    let selectFile = event.target.files[0];

    if (selectFile) {
      //inspect if file is seleceted and it is pdf
      if (selectFile && fileType.includes(selectFile.type)) {
        // Kun tiedosto on valittu ja se on pdf, lähetetään tiedosto uploadFile(selectFile) funktiolla ylöspäin <HomePage /> komponenttiin
        // jossa se asetetaan setPdfFile()
        uploadFile(selectFile);
        let reader = new FileReader();
        reader.readAsDataURL(selectFile);
        reader.onloadend = (event) => {
          setPdfFile(event.target.result);
        };
      }
    }
  };
  return (
    <div className="submitFile mb-2 text-center">
      <input type="file" name="file" onChange={handleSubmit} />

      <div style={{ height: "450px" }}>
        {pdfFile ? (
          <div
            style={{
              border: "1px solid rgba(0, 0, 0, 0.3)",
              height: "100%",
            }}
          >
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js">
              <Viewer fileUrl={pdfFile} />
            </Worker>
          </div>
        ) : (
          <div
            style={{
              alignItems: "center",
              border: "2px dashed rgba(0, 0, 0, .3)",
              display: "flex",
              fontSize: "2rem",
              height: "100%",
              justifyContent: "center",
              width: "100%",
            }}
          >
            PDF esikatselu
          </div>
        )}
      </div>
    </div>
  );
};

export default Openfile;
