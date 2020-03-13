"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_response_1 = require("../common/http-response");
// Extract storage key from storage account connection string in environment variable "AzureWebJobsStorage"
const storageKey = process.env["AzureWebJobsStorage"].split(";")[2].replace("AccountKey=", "");
function run(context, req) {
    return __awaiter(this, void 0, void 0, function* () {
        // Data can be sent as an url to a blob storage or directly as form-data
        // POST http://localhost:7071/api/storevalues?source=https://verseagilitystorage.blob.core.windows.net/data/raw_in_option1.csv
        const command = req.params['command'];
        const queries = req.query;
        context.log('api endpoint triggered');
        context.log(command);
        context.log(queries);
        if (command == "score") {
            // Input is JSON
            // "id": "4768bdd97c234370a76704e4f91a0e13",
            // "from": "pikasu",
            // "date": "20 November, 2019",
            // "subject": "Edge Telefonnummern-Erkennung ergänzt mit falscher Landesvorwahl",
            // "body": "Microsoft Edge erkennt automatisch Telefonnummern und zeigt sie als Link an, um sie mit Skype anzuwählen. So weit so gut, aber dummerweise wird als Landesvorwahl immer +49 für Deutschland vorangestellt. Ich wohne aber in der Schweiz und möchte in der Regel Teilnehmer in der Schweiz erreichen, also mit Landesvorwahl +41. Kann ich das in Edge irgendwo einstellen?",
            // Output (add)
            //"status": "score"
            //"attachments": [...]
        }
        else if (command == "test") {
            var response = new http_response_1.HttpResponse(http_response_1.Status.SUCCESS, "Test successful");
            context.res = response.create();
        }
        else {
            var response = new http_response_1.HttpResponse(http_response_1.Status.BADREQUEST, "No valid command was provided");
            context.res = response.create();
        }
    });
}
exports.run = run;
//# sourceMappingURL=index.js.map