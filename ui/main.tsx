import React from "react";
import { createRoot } from "react-dom/client";
import { AppRoot } from "@dynatrace/strato-components/core";
import { useDql } from "@dynatrace-sdk/react-hooks";
import { View, Run } from "./view";
import config from "./local.mapping.json";
const pairs = config as { repo: string; id: string }[];
const filter =
  pairs
    .map(
      (p) =>
        " (Repositorio == " +
        JSON.stringify(p.repo) +
        " and WorkflowId == " +
        JSON.stringify(p.id) +
        ")",
    )
    .join(" or ") || "false";
const query = `fetch events, from:now()-30d
| filter event.kind == "SDLC_EVENT" and event.provider == "github" and event.category == "pipeline" and event.status == "finished"
| parse workflow, "JSON:wf"
| parse workflow_run, "JSON:wr"
| fields timestamp, Repositorio=vcs.repository.name, Workflow=wf[name], WorkflowId=toString(cicd.pipeline.id), Execucao=toString(cicd.pipeline.run.id), Tentativa=wr[run_attempt], Resultado=cicd.pipeline.run.outcome, Link=cicd.pipeline.run.url.full
| filter ${filter}
| sort timestamp desc
| dedup Repositorio, Execucao, Tentativa
| sort timestamp desc
| limit 2000`;
const mapping = config as {
  repo: string;
  id: string;
  domain?: string;
  system?: string;
}[];
const catalog = new Map(
  mapping.filter((p) => p.domain && p.system).map((p) => [p.repo, p]),
);
function Live() {
  const { data, error, isLoading } = useDql({ query });
  return isLoading ? (
    <p>Consultando o Grail…</p>
  ) : error ? (
    <p role="alert">Falha ao consultar eventos. {String(error)}</p>
  ) : (
    <View
      rows={((data?.records ?? []) as unknown as Run[]).map((r) => ({
        ...r,
        domain: catalog.get(r.Repositorio)?.domain,
        system: catalog.get(r.Repositorio)?.system,
      }))}
      label="Grail · últimos 30 dias · até 2.000 tentativas recentes"
    />
  );
}
createRoot(document.getElementById("root")!).render(
  <AppRoot>
    <Live />
  </AppRoot>,
);
