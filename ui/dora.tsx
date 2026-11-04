import { Filter } from "./filter";
import React, { useState } from "react";
import { useDql } from "@dynatrace-sdk/react-hooks";
type Event = {
  time: string;
  repo: string;
  pipeline: string;
  outcome: string;
  minutes: number;
};
const query = `fetch events, from:now()-7d
| filter event.kind == "SDLC_EVENT" and event.category == "pipeline" and event.status == "finished"
| fields time=timestamp, repo=vcs.repository.name, pipeline=cicd.pipeline.name, outcome=cicd.pipeline.run.outcome, minutes=toDouble(duration)/60000000000.0
| sort time asc
| limit 10001`;
function median(values: number[]) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return !v.length ? null : v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
const success = (r: Event) => r.outcome === "success";
const failure = (r: Event) => ["failure", "failed"].includes(r.outcome);
const format = (n: number | null, suffix = "") =>
  n === null
    ? "Sem dados"
    : n.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + suffix;
export function Dora({
  repositories,
  application,
}: { repositories?: string[]; application?: string } = {}) {
  const { data, error, isLoading } = useDql({
    query: repositories
      ? query.replace(
          "| fields time=",
          "| filter " +
            (repositories.length
              ? repositories
                  .map((r) => "vcs.repository.name == " + JSON.stringify(r))
                  .join(" or ")
              : "false") +
            "\n| fields time=",
        )
      : query,
  });
  const [repository, setRepository] = useState("");
  const all = (data?.records ?? []) as unknown as Event[];
  const rows = all.filter((r) => !repository || r.repo === repository);
  const ok = rows.filter(success),
    bad = rows.filter(failure);
  const cfr = rows.length ? (bad.length / rows.length) * 100 : null;
  const cards = [
    [
      "Deployment Frequency",
      format(ok.length / 7, " /dia"),
      "Pipelines bem-sucedidos divididos por 7 dias. Inclui builds e feature branches.",
      String(ok.length) + " sucessos",
    ],
    [
      "Lead Time for Changes",
      format(median(ok.map((r) => Number(r.minutes))), " min"),
      "Mediana da duração dos pipelines bem-sucedidos.",
      String(ok.length) + " sucessos",
    ],
    [
      "Change Failure Rate",
      format(cfr, "%"),
      "Eventos de pipelines com falha divididos por todos os finalizados. Reexecuções entram na contagem.",
      String(bad.length) + " falhas",
    ],
    [
      "Mean Time to Restore",
      "Em validação",
      "A reprodução da regra descrita na ajuda divergiu do valor do app de origem. A correlação precisa ser reconciliada antes de publicar este indicador.",
      "Consultar valor no app de origem",
    ],
    [
      "Pipeline Reliability",
      format(cfr === null ? null : 100 - cfr, "%"),
      "Complemento da taxa de falha, conforme o modelo do CI/CD Observability.",
      String(rows.length) + " eventos",
    ],
  ];
  return (
    <section>
      <nav>
        <div>
          <small>CI/CD OBSERVABILITY · MODELO ATUAL</small>
          <h1>
            {application
              ? "Indicadores de delivery · " + application
              : "DORA e saúde das pipelines"}
          </h1>
        </div>
        <a
          href="/ui/apps/community.cicd.observability/dora"
          target="_blank"
          rel="noreferrer"
        >
          Abrir app de origem ↗
        </a>
      </nav>
      <p>
        Últimos 7 dias · todos os workflows · classificação e cálculos baseados
        na ajuda da versão 1.7.0 do CI/CD Observability.
      </p>
      <Filter
        label="Repositório"
        values={Array.from(
          new Set(all.map((r) => r.repo).filter(Boolean)),
        ).sort()}
        value={repository}
        change={setRepository}
      />{" "}
      {isLoading ? (
        <p>Consultando eventos SDLC…</p>
      ) : error ? (
        <p role="alert">Falha na consulta. {String(error)}</p>
      ) : all.length > 10000 ? (
        <p role="alert">
          O período excedeu 10.000 eventos. Os indicadores foram suspensos para
          evitar totais parciais.
        </p>
      ) : (
        <>
          <div className="widgets">
            {cards.map(([title, value, definition, detail]) => (
              <article key={title}>
                <div className="value">
                  <strong style={{ fontSize: 36 }}>{value}</strong>
                </div>
                <div className="metric-heading">
                  <h2>{title}</h2>
                  <details>
                    <summary>O que mede?</summary>
                    <p>{definition}</p>
                  </details>
                </div>
                <p>{detail}</p>
              </article>
            ))}
          </div>
          <h2>Saúde das pipelines</h2>
          <div className="widgets">
            {[
              ["Total de eventos", String(rows.length)],
              [
                "Success Rate",
                format(
                  rows.length ? (ok.length / rows.length) * 100 : null,
                  "%",
                ),
              ],
              [
                "Duração média",
                format(
                  rows.length
                    ? rows.reduce((n, r) => n + Number(r.minutes || 0), 0) /
                        rows.length
                    : null,
                  " min",
                ),
              ],
            ].map(([t, v]) => (
              <article key={t}>
                <h2>{t}</h2>
                <strong style={{ fontSize: 32 }}>{v}</strong>
              </article>
            ))}
          </div>
          <h2>Distribuição por pipeline</h2>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Eventos</th>
                  <th>Falhas</th>
                  <th>CFR</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(rows.map((r) => r.pipeline || r.repo)))
                  .map((key) => {
                    const group = rows.filter(
                      (r) => (r.pipeline || r.repo) === key,
                    );
                    const failed = group.filter(failure).length;
                    return { key, count: group.length, failed };
                  })
                  .sort((a, b) => b.failed - a.failed)
                  .map((g) => (
                    <tr key={g.key}>
                      <td>{g.key}</td>
                      <td>{g.count}</td>
                      <td>{g.failed}</td>
                      <td>{format((g.failed / g.count) * 100, "%")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <details className="requirements">
        <summary>O que validar com a B3 para evoluir esta visão</summary>
        <ul>
          <li>Relacionar repositórios a domain e system no catálogo.</li>
          <li>
            Identificar quais workflows e ambientes representam deploy em
            produção.
          </li>
          <li>
            Disponibilizar SHA e instante do commit para medir lead time até
            produção e commits únicos.
          </li>
          <li>
            Relacionar incidentes, rollback e recuperação às mudanças para medir
            impacto em produção.
          </li>
          <li>
            Confirmar a regra de tentativas e o nome estável de cada pipeline
            para correlação de recuperação.
          </li>
        </ul>
      </details>
    </section>
  );
}
