const fs = require('fs');
const Path = require("path");
const express = require('express');
const { isHiddenFile } = require("is-hidden-file");
const { execFile } = require('child_process');
const securedRoutes = express.Router();
const app = express();
const Jimp = require("jimp");

require('dotenv').config();

function authentication(req, res, next) {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')
  if (login && password && login === process.env.USER && password === process.env.PASSWORD) {
    return next()
  }

  res.set('WWW-Authenticate', 'Basic realm="401"')
  res.status(401).send('Authentication required to access resource.')
}


securedRoutes.use(authentication)
securedRoutes.use(express.urlencoded({ extended: true }));
securedRoutes.use(express.json());
app.use("/secure", securedRoutes)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const DefaultExtensions = [".txt", ".lua", ".lua", ".js", ".cpp", ".c", ".h", ".hpp", ".dll", ".exe", ".py", ".png", ".jpg", ".jpeg", '.PNG', ".JPG", ".JPEG"]
const BlackListed = ["found.000", "DeliveryOptimization", "Recovery", "System Volume Information", "System", "Uninstall.exe", "System32"]
const BlacklistedContents = [".exe", ".dll", ".png", ".jpg", ".jpeg", '.PNG', ".JPG", ".JPEG"]

function DoesPathExists(path) {
  return fs.existsSync(path)
}

function GetFileStatus(file, path) {
  var Allowed = (!BlackListed.includes(file)) && (DefaultExtensions.includes(Path.extname(file))) && (!isHiddenFile(path + "/" + file))
  var IsBlacklisted = BlacklistedContents.includes(Path.extname(file))
  var Contents = null

  if (path && Allowed) {
      if (IsBlacklisted) {
        Contents = ["Cant read contents", "0"]
      } else {
        Contents = [fs.readFileSync(path + "/" + file).toString(), (fs.statSync(path + "/" + file).size / 1000).toString()]
      }
  }

  return Allowed, IsBlacklisted, Contents
}

function ExecuteFile(path) {
  if (!DoesPathExists(path)) {
    return "Path does not exist"
  }

  execFile(path, []);

  return "<Loaded exe>"
}


function GetFiles(path) {
  var ResultingFiles = {}

  fs.readdirSync(path).forEach(file => {
    var Allowed, _, Contents = GetFileStatus(file, path)

    if (Allowed) {
      ResultingFiles[file] = Contents
    }
  })

  return ResultingFiles
}

function GetEverything(path, extensions) {
  let FinalResult = {
    ["Directories"]: {},
    ["Files"]: {}
  };

  fs.readdirSync(path).forEach(file => {
    if (!BlackListed.includes(file) && (isHiddenFile(path + "/" + file) === false)) {
      var Stats = fs.statSync(path + "/" + file)

      if (Stats.isDirectory()) {
        FinalResult["Directories"][file] = GetFiles(path + "/" + file);
      } else if (Stats.isFile() && extensions.includes(Path.extname(file))) {
        var _, _, Contents = GetFileStatus(file, path)

        FinalResult["Files"][file] = Contents
      }
    }
  })

  return FinalResult
}

app.listen(1820, function () {
  console.log("Listening on port 1820 ")
})

securedRoutes.post("/files", (request, response) => {
  response.send(JSON.stringify(GetFiles("D:/Text files", DefaultExtensions)))
})

securedRoutes.post("/all", (request, response) => {
  if ((!request.body) || (!request.body.Path)) {
    response.send("Missing path from request.body")
    return
  }

  response.send(JSON.stringify(GetEverything(request.body.Path, DefaultExtensions)))
})

securedRoutes.post("/execute", (request, response) => {
  if ((!request.body) || (!request.body.Path)) {
    response.send("Missing path from request.body")
    return
  }

  var Result = ExecuteFile(request.body.Path);
  response.send(Result)
})

securedRoutes.post("/getImage", async function (request, res) {
  var Data = {}

  if ((!request.body) || (!request.body.Path)) {
    res.send("Missing path from request.body")
    return
  }

  if (!DoesPathExists(request.body.Path)) {
    console.log(request.body.Path)
    res.send("001")
    return
  }

  var ind = 1;

  var jimg = await Jimp.read(request.body.Path)
  jimg.resize(400, 500);

  Jimp.read(jimg)
    .then(image => {
      var width = image.bitmap.width;
      var height = image.bitmap.height;

      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var pixel = Jimp.intToRGBA(image.getPixelColor(x, y));

          Data[ind] = [pixel.r, pixel.g, pixel.b];
          ind++;
        }
      }
      res.send(JSON.stringify(Data));
    });

})