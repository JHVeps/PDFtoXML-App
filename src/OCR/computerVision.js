/* 
1. npm install @azure/cognitiveservices-computervision  
2. React komponentissa: import { computerVision } from "./OCR/computerVision.js"; 
3. React komponentissa: const url = e.target.files[0];
4. React komponentissa: computerVision(url).then(data => console.log(data));
*/

// Azure SDK client libraries
import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";

// Authentication requirements
const key = "35b89cdd8a9e404bbd4a51f157e6850b";
const endpoint = "https://pdfviewer.cognitiveservices.azure.com/";

// Cognitive service features

// Tarviiko meidän nyt tätä tarkastaa ollenkaan..
/* export const isConfigured = () => {
  const result =
    key && endpoint && key.length > 0 && endpoint.length > 0 ? true : false;
  console.log(`key = ${key}`);
  console.log(`endpoint = ${endpoint}`);
  console.log(`ComputerVision isConfigured = ${result}`);
  return result;
}; */

// Wait for text detection to succeed
const wait = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

// Analyze Image from URL
export const computerVision = async (url) => {
  // authenticate to Azure service
  const computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
    endpoint
  );

  const returnData = await readTextFromURL(computerVisionClient, url);
  return returnData;
};
// analyze text in image
const readTextFromURL = async (client, url) => {
  // Muutin tuon seuraavan rivin:
  //let result = await client.read(url);
  let result = await client.readInStream(url);
  let operationID = result.operationLocation.split("/").slice(-1)[0];

  // Wait for read recognition to complete
  // result.status is initially undefined, since it's the result of read

  while (result.status !== "succeeded") {
    await wait(500);
    result = await client.getReadResult(operationID);
    // Tässä resultissa on se array missä on kaikki sanat:
    //console.log("result", result);
  }

  // Return the first page of result.
  // Replace[0] with the desired page if this is a multi-page file such as .pdf or.tiff.
  return result.analyzeResult;
};
