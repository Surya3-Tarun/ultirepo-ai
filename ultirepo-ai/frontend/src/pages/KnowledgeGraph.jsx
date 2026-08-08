import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import PageHeading from "../components/PageHeading";
import { useRepo } from "../store/RepoContext";
import api from "../lib/api";

/**
 * Builds a simple force-directed relationship graph: repo root -> language
 * clusters -> largest files in each language. This is derived from the
 * stats the backend already computes (languages + largest files), giving
 * a genuinely data-driven graph without needing a separate AST-parsing
 * service.
 */
function buildGraph(stats) {
  const nodes = [{ id: stats.repo_url, group: "root", radius: 16 }];
  const links = [];

  Object.entries(stats.languages).forEach(([language, count]) => {
    nodes.push({ id: language, group: "language", radius: 10 + Math.min(count, 20) });
    links.push({ source: stats.repo_url, target: language });
  });

  stats.largest_files.forEach((file) => {
    const extension = file.path.split(".").pop();
    const language = Object.keys(stats.languages).find((lang) =>
      lang.toLowerCase().includes(extension?.toLowerCase() || "")
    );
    const parent = language && stats.languages[language] ? language : stats.repo_url;
    nodes.push({ id: file.path, group: "file", radius: 6 });
    links.push({ source: parent, target: file.path });
  });

  return { nodes, links };
}

const COLORS = { root: "#25f4ee", language: "#0fff9a", file: "#a4ff2e" };

export default function KnowledgeGraph() {
  const { activeRepo } = useRepo();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeRepo?.repoId) return;
    api.repoStats(activeRepo.repoId).then(setStats).catch((err) => setError(err.message));
  }, [activeRepo?.repoId]);

  useEffect(() => {
    if (!stats || !svgRef.current || !containerRef.current) return undefined;

    const width = containerRef.current.clientWidth;
    const height = 520;
    const { nodes, links } = buildGraph(stats);

    const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, width, height]);
    svg.selectAll("*").remove();

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(90).strength(0.6))
      .force("charge", d3.forceManyBody().strength(-160))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => d.radius + 8));

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#0fff9a")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-width", 1);

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => COLORS[d.group])
      .attr("fill-opacity", 0.75)
      .attr("stroke", (d) => COLORS[d.group])
      .attr("stroke-width", 1.5)
      .style("filter", "drop-shadow(0 0 6px rgba(15,255,154,0.6))")
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const label = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => (d.id.length > 22 ? `${d.id.slice(0, 20)}...` : d.id))
      .attr("font-size", 9)
      .attr("font-family", "Rajdhani, sans-serif")
      .attr("fill", "#eafff5")
      .attr("fill-opacity", 0.6)
      .attr("dx", 10)
      .attr("dy", 3);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    return () => simulation.stop();
  }, [stats]);

  if (!activeRepo?.repoId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24">
        <PageHeading eyebrow="RELATIONSHIP MAP" title="No Repository Indexed" subtitle="Index a repository first to render its knowledge graph." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24">
        <PageHeading eyebrow="RELATIONSHIP MAP" title="Graph Unavailable" subtitle={error} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <PageHeading
        eyebrow="ALIEN-TECH RELATIONSHIP MAP"
        title="Knowledge Graph"
        subtitle="Language clusters and their largest files, drawn as a force-directed graph. Drag any node to explore."
      />
      <div ref={containerRef} className="hologram-panel p-2">
        <svg ref={svgRef} className="w-full" style={{ height: 520 }} />
      </div>
    </div>
  );
}
