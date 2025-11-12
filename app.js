const { execSync } = require("child_process");
const fs = require("fs");

/**
 * Get commits from a specific branch that match any of the provided codes.
 * @param {string[]} codes
 * @param {string} branch
 * @returns {Array<Object>}
 */
function getCommitsByCodes(codes, branch) {
  const commits = new Map();
  
  for (const code of codes) {
    console.log(`🔍 Buscando commits con "${code}" en origin/${branch}...`);
    try {
      const output = execSync(
        `git log origin/${branch} --grep="${code}" --date=iso --pretty=format:"%H|%an|%ad|%s"`, 
        { encoding: "utf8" }
      );

      for (const line of output.trim().split("\n").filter(Boolean)) {
        const [hash, author, dateStr, message] = line.split("|");
        
        if (message.startsWith("Merge branch") || message.startsWith("Merged")) {
          continue;
        }

        const date = new Date(dateStr);
        const cleanMessage = message.trim().replace(/\[\w+-\d+\]:\s*/, '').trim(); 
        
        commits.set(hash, { hash, author, date, message, cleanMessage });
      }
    } catch (error) {
       console.error(`🚨 Error al ejecutar git log en origin/${branch} para ${code}:`, error.message.trim().split('\n')[0]);
    }
  }

  return Array.from(commits.values()).sort((a, b) => b.date - a.date);
}

function main() {
  let codes = process.argv.slice(2);
  
  if (codes.length === 0) {
    codes = [];
    console.log("⚠️ No se proporcionaron códigos de tarea en la línea de comandos.");
    return;
  } else {
    console.log("🛠️ Códigos de tarea a rastrear (obtenidos de la línea de comandos):", codes.join(', '));
  }
  
  const STAGING_BRANCH = "staging";
  const PROD_BRANCH = "production";

  execSync("git fetch --all", { stdio: "inherit" });

  const commitsStaging = getCommitsByCodes(codes, STAGING_BRANCH);
  const commitsProd = getCommitsByCodes(codes, PROD_BRANCH);

  const prodMessages = new Set(commitsProd.map(c => c.message));

  const commitsForDeployment = commitsStaging.filter(c => !prodMessages.has(c.message));

  console.log("\n==========================================");
  console.log(`📦 Resumen de Commits Rastreados (${codes.join(', ')}):`);
  console.log("==========================================");
  console.log("HASH | Autor | Fecha | Enviado a Prod | Mensaje");
  console.log("------------------------------------------");

  for (const c of commitsStaging) {
    const isInProd = prodMessages.has(c.message) ? "✅ Sí" : "❌ No";

    console.log(`${c.hash.slice(0, 7)} | ${c.author.slice(0, 15).padEnd(15)} | ${c.date.toISOString().slice(0, 10)} | ${isInProd.padEnd(8)} | ${c.message}`);
  }

  const csv = ["hash,author,date,message,in_production,cherry_pick_command"];
  
  for (const c of commitsStaging) {
    const isInProd = prodMessages.has(c.message);
    const msg = c.message.replace(/"/g, '""'); 
    const cherryPickCommand = !isInProd ? `git cherry-pick ${c.hash}` : "N/A - Already in Production";
    
    csv.push(`"${c.hash}","${c.author}","${c.date.toISOString()}","${msg}",${isInProd},"${cherryPickCommand}"`);
  }
  
  fs.writeFileSync("commits.csv", csv.join("\n"));
  
  console.log("\n==========================================");
  if (commitsForDeployment.length > 0) {
      console.log(`🚀 ${commitsForDeployment.length} Commit(s) listos para desplegar a production.`);
      
      const oldestCommit = commitsForDeployment[commitsForDeployment.length - 1]; 
      
      console.log(`Primer Commit NO en Prod (más antiguo): ${oldestCommit.hash.slice(0, 7)}`);
      console.log("👉 **Archivos generados:** commits.csv (contiene comandos de cherry-pick).");
  } else {
      console.log("🎉 Todos los commits de staging ya están presentes en production.");
  }
  console.log("==========================================");
}

main();