/**
 * ONNX-related type definitions
 */
/**
 * Types of models that can be converted to ONNX
 */
export var ConvertibleModels;
(function (ConvertibleModels) {
    ConvertibleModels["NER"] = "ner";
    ConvertibleModels["ZERO_SHOT"] = "zeroShot";
    ConvertibleModels["SENTIMENT"] = "sentiment";
})(ConvertibleModels || (ConvertibleModels = {}));
