// eslint-disable-next-line no-restricted-globals
self.onconnect = ({ ports: [port] }) => {
    port.onmessage = ({ data: url }) => {

        console.log("Received!");

        const response = new Promise((resolve, reject) => {
            fetch(`../../audio/${url}`)
                .then(response => {
                    response.ok
                        ? resolve(response.arrayBuffer())
                        : reject(`Couldn't load track ${url}\nStatus code - ${response.status}, Error - ${response.statusText}`)
                })
                .catch(error => { reject(`Error while fetching ${url}\nError -${error}`) })
        });
        response.then(x => port.postMessage(x), x => port.postMessage(x));
    }
}