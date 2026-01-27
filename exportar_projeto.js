const fs = require('fs');
const path = require('path');

// Nome do arquivo de saída baseado na pasta atual
const folderName = path.basename(__dirname);
const OUTPUT_FILE = `CONTEXTO_${folderName.toUpperCase()}.txt`;

const IGNORE_DIRS = ['node_modules', '.git', '.vscode', 'img', 'public/img', 'backups'];
const IGNORE_FILES = ['package-lock.json', OUTPUT_FILE, 'relatorio_historico.csv', 'MEU_PROJETO_COMPLETO.txt'];
const ALLOWED_EXTS = ['.js', '.ejs', '.json', '.css', '.html'];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            if (!IGNORE_FILES.includes(file) && ALLOWED_EXTS.includes(path.extname(file))) {
                arrayOfFiles.push(fullPath);
            }
        }
    });
    return arrayOfFiles;
}

try {
    console.log(`🔄 Exportando contexto de: ${folderName}...`);
    const allFiles = getAllFiles(__dirname);
    let content = `=== DUMP DE CONTEXTO: ${folderName.toUpperCase()} ===\n`;
    content += `Data: ${new Date().toLocaleString()}\n\n`;

    allFiles.forEach(file => {
        const relativePath = path.relative(__dirname, file);
        const fileContent = fs.readFileSync(file, 'utf8');
        content += `\n\n================================================\n`;
        content += `ARQUIVO: ${relativePath}\n`;
        content += `================================================\n`;
        content += fileContent;
    });

    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`✅ SUCESSO! Contexto salvo em: ${OUTPUT_FILE}`);
} catch (error) {
    console.error('❌ Erro:', error);
}
