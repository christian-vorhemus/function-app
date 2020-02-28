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
const storage_connection_1 = require("../common/storage-connection");
const csv_parser_1 = require("../parser/csv-parser");
const json_parser_1 = require("../parser/json-parser");
// Extract storage key from storage account connection string in environment variable "AzureWebJobsStorage"
const storageKey = process.env["AzureWebJobsStorage"].split(";")[2].replace("AccountKey=", "");
function storeValues(context, blob) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var documents;
            if (blob.contentType == "text/csv" || blob.contentType == "application/vnd.ms-excel") {
                // Parsers bring a document into the well defined OutputSchema format.
                var csvParser = new csv_parser_1.CSVParser(blob.content);
                documents = yield csvParser.parse();
            }
            else if (blob.contentType == "application/json") {
                var jsonParser = new json_parser_1.JsonParser(blob.content);
                documents = yield jsonParser.parse();
            }
            context.bindings.cosmosOutput = JSON.stringify(documents);
            resolve(true);
        }));
    });
}
function run(context, req) {
    return __awaiter(this, void 0, void 0, function* () {
        // Data can be sent as an url to a blob storage or directly as form-data
        // POST http://localhost:7071/api/storevalues?source=https://verseagilitystorage.blob.core.windows.net/data/raw_in_option1.csv
        const command = req.params['command'];
        const queries = req.query;
        context.log('Endpoint triggered');
        context.log(command);
        context.log(queries);
        // This path is used to store values in the database which are sent as URIs to an Azure storage
        // The 'source' query is used to specify the source, the Azure storage is the same which is
        // als used by the function. Store data files in the /data container
        if (command == "storevalues") {
            if ("source" in queries) {
                var source = queries['source'];
                var sourceParts = source.replace("https://", "").replace("http://", "").split("/");
                var accountName = sourceParts[0].split(".")[0];
                var containerName = sourceParts[1];
                var blobName = sourceParts.slice(2, sourceParts.length).join("/");
                var storageConnection = new storage_connection_1.StorageConnection(accountName, storageKey, containerName);
                var blob = yield storageConnection.getBlob(blobName);
                var res = yield storeValues(context, blob);
                if (res == false) {
                    var response = new http_response_1.HttpResponse(http_response_1.Status.BADREQUEST, "Error while storing documents");
                    context.res = response.create();
                }
            }
            else {
                var response = new http_response_1.HttpResponse(http_response_1.Status.BADREQUEST, "Request must contain 'source' query parameter");
                context.res = response.create();
            }
        }
        else if (command == "test") {
            var response = new http_response_1.HttpResponse(http_response_1.Status.SUCCESS, "Test successful");
            context.res = response.create();
        }
        else {
            var response = new http_response_1.HttpResponse(http_response_1.Status.SUCCESS, "Successfully uploaded", { "test": 1 });
            context.res = response.create();
        }
    });
}
exports.run = run;
//# sourceMappingURL=index.js.map