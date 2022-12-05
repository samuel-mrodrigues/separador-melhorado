'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const { PdfReader } = require("pdfreader")
import fs from "fs"
import { resolve } from 'path'
const isDevelopment = process.env.NODE_ENV !== 'production'

let janela;

ipcMain.handle("selecionar-pdf", async () => {
  let selecao_status = await dialog.showOpenDialog(janela, {
    title: "Selecione um arquivo PDF",
    properties: ['openFile'],
    filters: [{ name: "PDF", extensions: ['pdf', 'PDF'] }],
    buttonLabel: "Selecionar"
  })

  if (!selecao_status.canceled) {
    return selecao_status.filePaths[0]
  }
})

ipcMain.handle("selecionar-diretorio", async () => {
  let selecao_status = await dialog.showOpenDialog(janela, {
    title: "Selecione um diretorio",
    properties: ['openDirectory'],
    buttonLabel: "Selecionar"
  })

  if (!selecao_status.canceled) {
    return selecao_status.filePaths[0]
  }
})

ipcMain.handle("ler-pdf", async (evento, arquivo_caminho) => {
  return new Promise((resolve, reject) => {
    let conteudo_arquivo = []
    let status = {
      sucesso: false,
      conteudo: []
    }

    if (!fs.existsSync(arquivo_caminho)) resolve(status)
    
    new PdfReader().parseBuffer(fs.readFileSync(arquivo_caminho), (erro, item) => {
      if (erro) {
        resolve(status)
        return
      }

      if (item == undefined) {
        status.sucesso = true
        status.conteudo = conteudo_arquivo
        resolve(status)
        return
      }

      conteudo_arquivo.push(item)
    })

  })
})

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  janela = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await janela.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) janela.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    janela.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
