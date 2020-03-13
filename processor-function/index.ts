import {Context} from '@azure/functions';
import {HttpClient} from '../common/http-client';
import {readFileSync} from 'fs';
import {StorageConnection, StorageResponse} from '../common/storage-connection';
import {CSVParser} from '../parser/csv-parser';
import {OutputSchema} from '../schema/output';
import {JsonParser} from '../parser/json-parser';
import {DefaultParser} from '../parser/default-parser';

// The purpose of this function is to store documents that are placed into the /data container
// of the created storage account
const hostname: string = process.env["WEBSITE_HOSTNAME"];
const functionHostKey: string = process.env["FunctionHostKey"];
const storageAccount: string = process.env["AzureWebJobsStorage"].split(";")[1].replace("AccountName=", "");
const httpClient = HttpClient.getInstance();

// Extract storage key from storage account connection string in environment variable "AzureWebJobsStorage"
const storageKey: string = process.env["AzureWebJobsStorage"].split(";")[2].replace("AccountKey=", "");

async function storeValues(context: Context, blob: StorageResponse, storageConnection: StorageConnection): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        var documents: Array<OutputSchema>;

        // Parsers bring a document into the well defined OutputSchema format.
        // Add an if-else-statement here to decide how documents should be processed (e.g. based on the Content-Type)
        // To parse a new file type, add a folder and class to the /parser directory
        // The DefaultParser will call the documentconverter-function. If you just need a general parser without finetuning
        // the parsing process, you may use the DefaultParser as your standard parser.

        if(blob.contentType == "text/csv" || blob.contentType == "application/vnd.ms-excel") {
            var csvParser: CSVParser = new CSVParser(blob, storageConnection);
            documents = await csvParser.parse();
        } else if(blob.contentType == "application/json") {
            var jsonParser: JsonParser = new JsonParser(blob, storageConnection);
            documents = await jsonParser.parse();
        } else {
            var defaultParser: DefaultParser = new DefaultParser(blob);
            documents = await defaultParser.parse();
        }

        context.bindings.cosmosOutput = JSON.stringify(documents);
        resolve(true);
    });
}

export async function run(context: Context, docblob: Buffer) {

    context.log('document-processor triggered by storage blob');
    const docPath = context.bindingData.blobTrigger;

    var accountName = storageAccount;
    var containerName = docPath.split("/")[0];
    var blobName = docPath.split("/")[1];

    var storageConnection: StorageConnection = new StorageConnection(accountName, storageKey, containerName);
    var blob: StorageResponse = await storageConnection.getBlob(blobName);

    // We don't await the values to be stored because this could take some time and Http triggered function
    // will only allow idle open HTTP connections of about 2.5 minutes
    var finished: boolean = await storeValues(context, blob, storageConnection);

    if(finished) {
        context.log("Document processed");
    } else {
        context.log("Error while processing document");
    }



    // var prefix = "";
    // if(hostname.indexOf("localhost") == 0) {
    //     prefix = "http://";
    // } else {
    //     prefix =  "https://";
    // }

    // const docPath = context.bindingData.blobTrigger;
    // var url = prefix + hostname + "/api/storevalues?source=https://" + storageAccount + ".blob.core.windows.net/" + docPath + "&code=" + functionHostKey

    // context.log("Calling url " + url);
    // var response = await httpClient.post(url, {});
    // context.log(response);

}
