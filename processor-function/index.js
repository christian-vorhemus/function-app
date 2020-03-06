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
const http_client_1 = require("../common/http-client");
// The purpose of this function is to automatically trigger the official endpoint ("api"-function)
// once a new document is uploaded to the data container in the storage. If you want to disable
// this automatic call, just disable the function
const hostname = process.env["WEBSITE_HOSTNAME"];
const functionHostKey = process.env["FunctionHostKey"];
const storageAccount = process.env["AzureWebJobsStorage"].split(";")[1].replace("AccountName=", "");
const httpClient = http_client_1.HttpClient.getInstance();
function run(context, docblob) {
    return __awaiter(this, void 0, void 0, function* () {
        context.log('document-processor triggered by storage blob');
        var prefix = "";
        if (hostname.indexOf("localhost") == 0) {
            prefix = "http://";
        }
        else {
            prefix = "https://";
        }
        const docPath = context.bindingData.blobTrigger;
        var url = prefix + hostname + "/api/storevalues?source=https://" + storageAccount + ".blob.core.windows.net/" + docPath + "&code=" + functionHostKey;
        context.log("Calling url " + url);
        var response = yield httpClient.post(url, {});
        context.log(response);
    });
}
exports.run = run;
//# sourceMappingURL=index.js.map