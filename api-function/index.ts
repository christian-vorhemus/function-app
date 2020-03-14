import {HttpRequest, Context} from '@azure/functions';
import {HttpResponse, Status} from '../common/http-response';

// Extract storage key from storage account connection string in environment variable "AzureWebJobsStorage"
const storageKey: string = process.env["AzureWebJobsStorage"].split(";")[2].replace("AccountKey=", "");

export async function run(context: Context, req: HttpRequest) {

    // Data can be sent as an url to a blob storage or directly as form-data
    // POST http://localhost:7071/api/storevalues?source=https://verseagilitystorage.blob.core.windows.net/data/raw_in_option1.csv

    const command = req.params['command'];
    const queries = req.query;

    context.log('api endpoint triggered');
    context.log(command);
    context.log(queries);

    if(command == "score") {
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
