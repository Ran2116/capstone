//const API_KEY = "sk-FVLenQlaD8y7zjISE655Da43D60d479094DbFfF508A61717";  // Replace with your actual API Key
const API_BASE_URL = "https://zest-quiet-phalange2.glitch.me";  // Your API proxy

async function requestOAI(method, path, parametersOrCb, cb) {


  let options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
     // "Authorization": `Bearer ${API_KEY}` 
    },
    redirect: "follow",
  };
  if (parametersOrCb && typeof parametersOrCb != 'function') {
    options.body = JSON.stringify(parametersOrCb);
  }

  let res;
  try {
    res = await fetch(API_BASE_URL + path, options);
  } catch (e) {
    console.error('There was an error communicating to the OpenAI API proxy. Is it offline?');
  }

  let data;
  if (res && res.ok) {
    data = await res.json();
  } else if(res && !res.ok) {
    let message = 'The OpenAI API proxy returned an error with response code ' + res.status;
    try {
      let error = await res.json();
      if (error && error.error && error.error.message) {
        message += ': ' + error.error.message;
      }
    } catch (e) {}
    console.error(message);
  }

  if (typeof parametersOrCb == 'function') {
    parametersOrCb(data);
  } else if (typeof cb == 'function') {
    cb(data, parametersOrCb);
  }
  return data;
}
