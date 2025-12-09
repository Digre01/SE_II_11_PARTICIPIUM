import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../API/API.mjs";


const ConversationsPage = ({ wsMessage }) => {
  const [conversations, setConversations] = useState([]);
  const [externalConvs, setExternalConvs] = useState([]);
  const [internalConvs, setInternalConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notificationCounts, setNotificationCounts] = useState({});
  const navigate = useNavigate();

  // Carica conversazioni e notifiche all'avvio
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await API.fetchConversations();
        const externalConvs = data.filter(c => c.isInternal === false);
        const internalConvs = data.filter(c => c.isInternal === true);
        setExternalConvs(externalConvs);
        setInternalConvs(internalConvs);
        setConversations(data);
        const counts = await API.fetchNotificationCounts();
        setNotificationCounts(counts || {});
      } catch (err) {
        setError("Unable to load conversations.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Aggiorna conversazioni/notifiche in tempo reale quando arriva un messaggio dal WS
  useEffect(() => {
    if (!wsMessage) return;
    async function refresh() {
      try {
        const data = await API.fetchConversations();
        const externalConvs = data.filter(c => c.isInternal === false);
        const internalConvs = data.filter(c => c.isInternal === true);
        setExternalConvs(externalConvs);
        setInternalConvs(internalConvs);
        setConversations(data);
        const counts = await API.fetchNotificationCounts();
        setNotificationCounts(counts || {});
      } catch {}
    }
    refresh();
  }, [wsMessage]);

  const handleClick = (conversationId) => {
    navigate(`/conversations/${conversationId}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Your Reports</h2>
      {conversations.length === 0 ? (
        <div>No reports found.</div>
      ) : (
        <ul className="list-group">
          {externalConvs.map(conv => {
            // Cerca la conversazione interna per lo stesso report
            const internalConv = internalConvs.find(ic => ic.report?.id === conv.report?.id);
            return (
              <React.Fragment key={conv.id}>
                <div style={{ marginBottom: "0.8rem" }}>
                  <li
                    className="list-group-item list-group-item-action"
                    style={{ cursor: "pointer", position: "relative" }}
                    onClick={() => handleClick(conv.id)}
                  >
                    <div><strong>Report:</strong> {conv.report?.title || "-"}</div>
                    <div><strong>Status:</strong> {conv.report?.status || "-"}</div>
                    {notificationCounts[conv.id] > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        right: 18,
                        transform: 'translateY(-50%)',
                        minWidth: 26,
                        height: 26,
                        background: '#28a745',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        zIndex: 2
                      }}>{notificationCounts[conv.id]}</span>
                    )}
                  </li>
                  {internalConv && (
                    <li
                      key={internalConv.id}
                      className="list-group-item list-group-item-action bg-light"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleClick(internalConv.id)}
                    >
                      <span style={{ fontStyle: 'italic', color: '#007bff' }}>Internal comments</span>
                      {notificationCounts[internalConv.id] > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '50%',
                          right: 18,
                          transform: 'translateY(-50%)',
                          minWidth: 26,
                          height: 26,
                          background: '#28a745',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #fff',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          zIndex: 2
                        }}>{notificationCounts[internalConv.id]}</span>
                      )}
                    </li>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ConversationsPage;
