import {HttpRequest, Context} from '@azure/functions';
import {HttpResponse, Status} from '../common/http-response';
import {StorageConnection, StorageResponse} from '../common/storage-connection';
import {CSVParser} from '../parser/csv-parser';
import {OutputSchema} from '../schema/output';
import {JsonParser} from '../parser/json-parser';
import {DefaultParser} from '../parser/default-parser';

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
        context.log("Documents stored");
        resolve(true);
    });
}


export async function run(context: Context, req: HttpRequest) {

    // Data can be sent as an url to a blob storage or directly as form-data
    // POST http://localhost:7071/api/storevalues?source=https://verseagilitystorage.blob.core.windows.net/data/raw_in_option1.csv

    const command = req.params['command'];
    const queries = req.query;

    context.log('api endpoint triggered');
    context.log(command);
    context.log(queries);

    // This path is used to store values in the database which are sent as URIs to an Azure storage
    // The 'source' query is used to specify the source, the Azure storage is the same which is
    // als used by the function. Store data files in the /data container of the storage account.
    if(command == "storevalues") {
        if("source" in queries) {
            var source: string = queries['source'];
            var sourceParts = source.replace("https://", "").replace("http://", "").split("/");
            var accountName = sourceParts[0].split(".")[0];
            var containerName = sourceParts[1];
            var blobName = sourceParts.slice(2,sourceParts.length).join("/");

            var storageConnection: StorageConnection = new StorageConnection(accountName, storageKey, containerName);
            var blob: StorageResponse = await storageConnection.getBlob(blobName);

            // We don't await the values to be stored because this could take some time and Http triggered function
            // will only allow idle open HTTP connections of about 2.5 minutes
            var finished: boolean = await storeValues(context, blob, storageConnection);

            if(finished) {
                var response: HttpResponse = new HttpResponse(Status.SUCCESS, "Storing document started");
                context.res = response.create();
            } else {
                var response: HttpResponse = new HttpResponse(Status.BADREQUEST, "Storing document failed");
                context.res = response.create();
            }

        } else {
            var response: HttpResponse = new HttpResponse(Status.BADREQUEST, "Request must contain 'source' query parameter");
            context.res = response.create();
        }
    } else if(command == "score") {
        // Input is JSON
        // "id": "4768bdd97c234370a76704e4f91a0e13",
        // "from": "pikasu",
        // "date": "20 November, 2019",
        // "subject": "Edge Telefonnummern-Erkennung ergänzt mit falscher Landesvorwahl",
        // "body": "Microsoft Edge erkennt automatisch Telefonnummern und zeigt sie als Link an, um sie mit Skype anzuwählen. So weit so gut, aber dummerweise wird als Landesvorwahl immer +49 für Deutschland vorangestellt. Ich wohne aber in der Schweiz und möchte in der Regel Teilnehmer in der Schweiz erreichen, also mit Landesvorwahl +41. Kann ich das in Edge irgendwo einstellen?",

        // Output (add)
        //"status": "score"
        //"attachments": [...]

    } else if(command == "test") {
        var response: HttpResponse = new HttpResponse(Status.SUCCESS, "Test successful");
        context.res = response.create();
    } else {
        var response: HttpResponse = new HttpResponse(Status.BADREQUEST, "No valid command was provided");
        context.res = response.create();
    }

}
