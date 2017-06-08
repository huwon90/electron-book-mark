const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const request = require('superagent');
const getTitle = require('get-title');
const fs = require('fs');
const path = require('path');

let type = 'home';
let win = null;
const DATA_PATH = path.join(__dirname, './data.json');

const data = JSON.parse(fs.readFileSync(DATA_PATH));

app.on('ready', () => {
    win = new BrowserWindow({
        width: 400,
        height: 400,
        show: false,
        resizable: false,
        acceptFirstMouse: true,
        titleBarStyle: 'hidden',
        frame: false
    });

    win.loadURL(`file://${__dirname}/index.html`);
    win.webContents.openDevTools();

    win.once('ready-to-show', () => {
        win.show();
        update();
    });

    ipcMain.on('type', (event, _type) => {
        type = _type;
        update();
    });

    ipcMain.on('paste', (event, url) => {
        // 1. url 이 정말 url
        if (url.indexOf('http://') > -1 || url.indexOf('https://') > -1) {
            // 2. 읽어서 타이틀 가져오기

            // npm i superagent - S
            request.get(url)
                .end((err, response) => {
                    // npm i get-title -S
                    getTitle(response.res.text).then(title => {
                        data.push({type, url, title});
                        fs.writeFileSync(DATA_PATH, JSON.stringify(data));
                        update();
                    });
                });

        } else {
            dialog.showErrorBox('경고', 'url 이 아닌듯 합니다.');
        }
    });

    ipcMain.on('remove', (event, index) => {
        console.log(index);

        const currentData = data.filter((item, i) => {
            item.index = i;
            return item.type === type;
        });

        let remoceId = null;

        currentData.forEach((item, i) => {
            if (i === index) {
                removeId = item.index;
            }
        });

        data.splice(removeId, 1);
        fs.writeFileSync(DATA_PATH, JSON.stringify(data));
        update();
    });
});

function update() {
    const updateData = data.filter(item => item.type === type);
    if (win !== null) {
        win.webContents.send('data', updateData);
    }
}