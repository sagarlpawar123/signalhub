"use client";

import { useState } from "react";
import { Search, Server, ChevronDown } from "lucide-react";
import { COMPONENT_STATUS_LABEL, type ComponentStatus } from "@/lib/status";
import styles from "./SingtelStatusPortal.module.css";

export type PortalService = { id: string; name: string; category: string; status: string; description: string };

export function PortalServiceTable({ services }: { services: PortalService[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const categories = [...new Set(services.map((service) => service.category))];
  const filtered = services.filter((service) => (!category || service.category === category) && `${service.name} ${service.description} ${service.category}`.toLowerCase().includes(query.toLowerCase()));
  return <section className={styles.panel} id="services" aria-labelledby="service-heading">
    <div className={styles.tableToolbar}>
      <h2 id="service-heading">Service Status</h2>
      <label className={styles.search}><Search size={17} /><span className={styles.srOnly}>Search services</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" /></label>
      <label><span className={styles.srOnly}>Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
    </div>
    <div className={styles.legend}><span data-state="OPERATIONAL">● Operational</span><span data-state="DEGRADED_PERFORMANCE">● Degraded</span><span data-state="MAJOR_OUTAGE">● Outage</span><span data-state="UNDER_MAINTENANCE">● Maintenance</span></div>
    <div className={styles.tableScroll}><table className={styles.table}>
      <thead><tr><th scope="col">Service</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Details</th></tr></thead>
      <tbody>{filtered.map((service) => <tr key={service.id}>
        <th scope="row"><span className={styles.serviceName}><Server size={20} aria-hidden="true" />{service.name}</span></th>
        <td>{service.category}</td><td><span className={styles.serviceStatus} data-state={service.status}><span aria-hidden="true">●</span> {COMPONENT_STATUS_LABEL[service.status as ComponentStatus] ?? service.status}</span></td>
        <td><details className={styles.serviceDetails}><summary>View details <ChevronDown size={14} /></summary><p>{service.description || (service.status === "OPERATIONAL" ? "All services are running normally." : "See active incidents for the latest updates.")}</p></details></td>
      </tr>)}</tbody>
    </table></div>
    {filtered.length === 0 && <p className={styles.empty}>{services.length ? "No services match your search." : "No services have been published yet."}</p>}
    <div className={styles.tableFooter} aria-live="polite">Showing {filtered.length} of {services.length} services</div>
  </section>;
}
