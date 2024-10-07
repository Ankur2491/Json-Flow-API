var express = require('express');
var bodyParser = require('body-parser')
var cors = require('cors');
var jsonParser = bodyParser.json()
var app = express();
app.use(jsonParser)
app.use(cors())
  const edgeType = 'smoothstep'
  const position = { x: 0, y: 0 };
  let nodeMap = {};
  let edgeMap = {};
  function capturePrimitives(json, source) {
      let visitedKeys = new Set();
      if (typeof json === 'object' && !Array.isArray(json) && json !== null) {
          let sourceNode = {
              id: `${source}`,
              type: 'textUpdater',
              data: { value: {} },
              position
          }
          let keyArr = Object.keys(json);
          for (let key of keyArr) {
              if (typeof json[key] == 'string' || typeof json[key] == 'boolean' || typeof json[key] == 'number') {
                  sourceNode.data.value[key] = json[key];
                  visitedKeys.add(key);
              }
          }
          if(sourceNode.id.includes("-")) {
            edgeId = sourceNode.id.substring(0, sourceNode.id.lastIndexOf("-")) 
            let edge = { id: `e-${edgeId}-${source}`, source: `${edgeId}`, target: `${source}`, type: edgeType, animated: true, style:{ stroke:'#FF0072', strokeWidth:4} }
            edgeMap[edge.id] = edge;
          }

          nodeMap[source] = sourceNode;
          
      }
      return visitedKeys;
  }
  function generateNodeAndEdges(json, source) {
      let visitedkeys = capturePrimitives(json, source);
      let isArray = Array.isArray(json);
      if (isArray) {
          let arrayNodeType = typeof json[0];
          if (arrayNodeType == 'string' || arrayNodeType == 'number' || arrayNodeType == 'boolean') {
              for (let idx in json) {
                  let arrayElemNode = {
                      id: `${source}-${idx}`,
                      data: { value: `${json[idx]}` },
                      type: 'textUpdater',
                      position
                  }
                  let arrayElemEdge = { id: `e-${source}-${idx}`, source: `${source}`, target: `${source}-${idx}`, type: edgeType, animated: true, style:{stroke:'#FF0072',strokeWidth:4}  }
                  nodeMap[arrayElemNode.id] = arrayElemNode;
                  edgeMap[arrayElemEdge.id] = arrayElemEdge;
                  // nodes.push(arrayElemNode);
                  // edges.push(arrayElemEdge);
              }
          }
          else {
              for (let idx in json) {
                generateNodeAndEdges(json[idx], `${source}-${idx}`)
              }
          }
      }
      else {
          let keyArr = Object.keys(json);
          for (let key of keyArr) {
              if (!visitedkeys.has(key)) {
                if(Array.isArray(json[key])) {
                  let val = `${key} (${json[key].length})`
                  let node = {
                      id: `${source}-${key}`,
                      data: { value: `${val}` },
                      type: 'textUpdater',
                      position
                  }
                  let edge = {
                      id: `e-${source}-${key}`, source: `${source}`, target: `${source}-${key}`, type: edgeType, animated: true, style:{stroke:'#FF0072',strokeWidth:4}
                  }
                  nodeMap[node.id] = node;
                  edgeMap[edge.id] = edge;
                  generateNodeAndEdges(json[key],`${source}-${key}`)
                }
                else if(typeof json === 'object' && !Array.isArray(json) && json !== null) {
                    let rootNode = {
                        id: `${source}-${key}-root`,
                        data: { value: `${key}` },
                        type: 'textUpdater',
                        position
                    }
                    let rootEdge = {
                        id: `e-${source}-${key}-root`, source: `${source}`, target: `${source}-${key}-root`, type: edgeType, animated: true, style:{stroke:'#FF0072',strokeWidth:4}
                    }
                    nodeMap[rootNode.id] = rootNode;
                    // edgeMap[rootEdge.id] = rootEdge;
                    let node = {
                        id: `${source}-${key}`,
                        data: { value: `${key}` },
                        type: 'textUpdater',
                        position
                    }
                    let edge = {
                        id: `e-${source}-${key}`, source: `${source}`, target: `${source}-${key}`, type: edgeType, animated: true, style:{stroke:'#FF0072',strokeWidth:4}
                    }
                    nodeMap[node.id] = node;
                    edgeMap[edge.id] = edge;
                    generateNodeAndEdges(json[key],`${source}-${key}-root`)
                }
              }
          }
      }
  }


app.post('/formStructure', (req, res)=> {
    let jsonPayload = req.body.reqBody.jsonPayload;
    nodeMap = {}
    edgeMap = {}
    let jsonBody = JSON.parse(jsonPayload);
    if(Array.isArray(jsonBody)) {
        let newJsonBody = {"root":jsonBody}
        generateNodeAndEdges(newJsonBody, "root") 
    }
    else {
    generateNodeAndEdges(jsonBody, "root");
    }
    res.send({nodeMap: nodeMap, edgeMap:edgeMap});
});

app.listen("4000", ()=>{
    console.log("App started in port 4000");
    });