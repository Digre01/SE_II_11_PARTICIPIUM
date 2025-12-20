import { Table, Card } from "react-bootstrap";
import { ReportCard, ReportRow } from "./ReportsRowCard.jsx";

export function ReportsTable({ reports, user, isExternal, onAction, onRowClick, title, headerContent }) {
    return (
        <Card className="shadow-sm p-4">

            {headerContent ? (
                <div className="mb-4">
                    {headerContent}
                </div>
            ) : (
                <h3 className="mb-4 text-primary text-center">{title}</h3>
            )}

            {reports.length === 0 ? (
                <p className="text-center text-muted py-4">No reports available.</p>
            ) : (
                <>

                    <Table responsive hover className="d-none d-md-table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Latitude</th>
                            <th>Longitude</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reports.map((r, idx) => (
                            <ReportRow
                                key={r.id}
                                idx={idx}
                                report={r}
                                user={user}
                                isExternal={isExternal}
                                onAction={onAction}
                                onRowClick={onRowClick}
                            />
                        ))}
                        </tbody>
                    </Table>

                    <div className="d-md-none">
                        {reports.map(r => (
                            <ReportCard
                                key={r.id}
                                report={r}
                                user={user}
                                isExternal={isExternal}
                                onAction={onAction}
                                onCardClick={onRowClick}
                            />
                        ))}
                    </div>
                </>
            )}
        </Card>
    );
}