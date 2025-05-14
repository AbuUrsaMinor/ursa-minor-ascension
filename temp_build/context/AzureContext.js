"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureProvider = AzureProvider;
exports.useAzure = useAzure;
var react_1 = require("react");
var azure_1 = require("../lib/azure");
var storage_1 = require("../lib/storage");
// Create context with default values
var AzureContext = (0, react_1.createContext)({
    endpoint: null,
    apiKey: null,
    isLoading: true,
    error: null
});
function AzureProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(null), endpoint = _b[0], setEndpoint = _b[1];
    var _c = (0, react_1.useState)(null), apiKey = _c[0], setApiKey = _c[1];
    var _d = (0, react_1.useState)(true), isLoading = _d[0], setIsLoading = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    // Initialize Azure credentials from stored connection key
    (0, react_1.useEffect)(function () {
        function loadCredentials() {
            return __awaiter(this, void 0, void 0, function () {
                var key, config, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, 6, 7]);
                            return [4 /*yield*/, (0, storage_1.getConnectionKey)()];
                        case 1:
                            key = _a.sent();
                            if (!key) return [3 /*break*/, 3];
                            return [4 /*yield*/, (0, azure_1.decodeConnectionKey)(key)];
                        case 2:
                            config = _a.sent();
                            setEndpoint(config.endpoint);
                            setApiKey(config.apiKey);
                            return [3 /*break*/, 4];
                        case 3:
                            setError('Connection key not found');
                            _a.label = 4;
                        case 4: return [3 /*break*/, 7];
                        case 5:
                            err_1 = _a.sent();
                            setError('Failed to decode connection key');
                            console.error('Error loading Azure credentials:', err_1);
                            return [3 /*break*/, 7];
                        case 6:
                            setIsLoading(false);
                            return [7 /*endfinally*/];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        }
        loadCredentials();
    }, []);
    return (<AzureContext.Provider value={{ endpoint: endpoint, apiKey: apiKey, isLoading: isLoading, error: error }}>
            {children}
        </AzureContext.Provider>);
}
function useAzure() {
    return (0, react_1.useContext)(AzureContext);
}
