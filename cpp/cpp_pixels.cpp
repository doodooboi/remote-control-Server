#include <napi.h>
#include <ImageMagik++.h>

using namespace Napi;

InitializeMagick("D:\remote-control Server");

Napi::Object GetImagePixels(const Napi::CallbackInfo& info, Napi::String file) {
    Napi::Object Pixels = Napi::Object::New();

    Image OpenedImage;
    try {
      OpenedImage.read("D:\file.png")

      OpenedImage.resize(400,500)

      Pixels.Set("hello", "world")

      return Pixels
    } catch(Exception &error_) {
      return Napi::String::new("Caught Exception: " + error_.what())
    }
}

Napi::String Method(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::String::New(env, "world");
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "HelloWorld"),
              Napi::Function::New(env, Method));
  return exports;
}

NODE_API_MODULE(addon, Init)