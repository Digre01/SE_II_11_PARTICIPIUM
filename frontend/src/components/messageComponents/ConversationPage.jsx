import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../../API/API.mjs";
import { isSameDay, format, parseISO } from "date-fns";
import { FaPaperPlane } from "react-icons/fa";
import { Card, CardBody, CardTitle, CardText } from "design-react-kit";

const SERVER_URL = "http://localhost:3000";

const ConversationPage = ({ user, handleNotificationsUpdate, wsMessage }) => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [reportDetails, setReportDetails] = useState(null);
  const scrollContainerRef = useRef(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Segna le notifiche come lette all'apertura della conversazione
        await API.markNotificationsAsRead(conversationId);
        if (typeof handleNotificationsUpdate === 'function') {
          handleNotificationsUpdate();
        }
        const msgs = await API.fetchMessages(conversationId);
          // Ordina per data crescente
          setMessages(
            [...msgs].sort((a, b) => {
              const da = a.createdAt ? new Date(a.createdAt) : 0;
              const db = b.createdAt ? new Date(b.createdAt) : 0;
              return da - db;
            })
          );
        if (msgs.length > 0 && msgs[0].conversation && msgs[0].conversation.report) {
          setReportTitle(msgs[0].conversation.report.title);
          setReportStatus(msgs[0].conversation.report.status || "");
          setIsInternal(!!msgs[0].conversation.isInternal);
          setReportDetails(msgs[0].conversation.report);
          // Fetch photos
          if (msgs[0].conversation.report.id) {
            const photoData = await API.fetchReportPhotos(msgs[0].conversation.report.id);
            setPhotos(photoData);
          }
        } else {
          const convs = await API.fetchConversations();
          const conv = convs.find(c => String(c.id) === String(conversationId));
          setReportTitle(conv?.report?.title || "Messages");
          setReportStatus(conv?.report?.status || "");
          setIsInternal(!!conv?.isInternal);
          setReportDetails(conv?.report || null);
          // Fetch photos
          if (conv?.report?.id) {
            const photoData = await API.fetchReportPhotos(conv.report.id);
            setPhotos(photoData);
          }
        }
      } catch (err) {
        setError("Unable to load messages.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [conversationId, handleNotificationsUpdate]);

  // Aggiorna i messaggi in tempo reale quando arriva un messaggio dal WS
  useEffect(() => {
    if (!wsMessage) return;
    // Aggiorna solo se il messaggio è della conversazione attuale
    if (wsMessage.conversation && String(wsMessage.conversation.id) === String(conversationId)) {
      async function refresh() {
        try {
          const msgs = await API.fetchMessages(conversationId);
            setMessages(
              [...msgs].sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt) : 0;
                const db = b.createdAt ? new Date(b.createdAt) : 0;
                return da - db;
              })
            );
        } catch {}
      }
      refresh();
    }
  }, [wsMessage, conversationId]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const getMessageType = (msg) => {
    if (msg.isSystem) return "system";
    if (msg.sender?.id && user?.id && String(msg.sender.id) === String(user.id)) return "mine";
    return "other";
  };

  const getAlignment = (type) => {
    if (type === "system") return "center";
    if (type === "mine") return "end";
    return "start";
  };

  const getBgColor = (type) => {
    if (type === "system") return "#cce4ff";
    if (type === "mine") return "#b6f5c9";
    return "#ffe5b4";
  };

  const renderMessages = () => {
    const rendered = [];
    let lastDate = null;
    messages.forEach((msg, idx) => {
      const msgDate = msg.createdAt ? parseISO(msg.createdAt) : null;
      if (msgDate && (!lastDate || !isSameDay(msgDate, lastDate))) {
        rendered.push(
          <div key={`day-separator-${idx}`} className="text-center my-3">
            <span className="small" style={{ fontWeight: 600, color: '#555' }}>
              {format(msgDate, "EEEE, dd/MM/yyyy")}
            </span>
          </div>
        );
        lastDate = msgDate;
      }
      const type = getMessageType(msg);
      const align = getAlignment(type);
      const bgColor = getBgColor(type);
      rendered.push(
        <div key={msg.id || idx} className={`d-flex mb-3 justify-content-${align}`}>
          <div
            className="rounded"
            style={{
              minWidth: 120,
              maxWidth: 400,
              padding: "8px 12px",
              background: bgColor,
              color: "#003366",
              fontStyle: type === "system" ? "italic" : "normal",
              marginLeft: align === "center" ? "auto" : undefined,
              marginRight: align === "center" ? "auto" : undefined,
              textAlign: align === "center" ? "center" : "left"
            }}
          >
            {type === "system" ? (
              <span>{msg.content}</span>
            ) : (
              <>
                <span style={{ fontWeight: "bold" }}>
                  {type === "mine" ? "You" : msg.sender?.username || "System"}
                </span>
                <br />
                {msg.content}
              </>
            )}
            <div className="text-end text-muted small mt-1">
              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}
            </div>
          </div>
        </div>
      );
    });
    return rendered.length ? rendered : <div className="text-center text-muted">No messages yet</div>;
  };

  // Solo staff member può inviare messaggi e solo se il report non è resolved
  const canSend = String(user?.userType || "").toLowerCase() === "staff" && reportStatus.toLowerCase() !== "resolved" && reportStatus.toLowerCase() !== "rejected";

  const handleSend = async (e) => {
    e.preventDefault();
    setSendError("");
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await API.sendMessage(conversationId, newMessage);
      setNewMessage("");
      // Aggiorna la lista
      const msgs = await API.fetchMessages(conversationId);
      setMessages(
        [...msgs].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt) : 0;
          const db = b.createdAt ? new Date(b.createdAt) : 0;
          return da - db;
        })
      );
    } catch (err) {
      setSendError("Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-fluid mt-4" style={{ maxWidth: 1600 }}>
      <div className="row">
        {/* Card informazioni report */}
        <div className="col-md-4 col-lg-3 mb-3">
          <Card className="shadow-sm" style={{ position: 'sticky', top: 20 }}>
            <CardBody className="p-4">
              {isInternal && (
                <div className="alert mt-2 mb-2 py-2 px-2 small">
                  <strong>Internal conversation</strong>
                </div>
              )}
              <CardTitle tag="h5" className="mb-3">{reportTitle || "Report Details"}</CardTitle>
              {reportDetails && (
                <>
                  <div className="mb-2">
                    <strong>Status:</strong>{" "}
                    <span className={`badge ${reportStatus.toLowerCase() === 'resolved' ? 'bg-success' : reportStatus.toLowerCase() === 'rejected' ? 'bg-danger' : reportStatus.toLowerCase() === 'suspended' ? 'bg-warning' : reportStatus.toLowerCase() === 'in progress' ? 'bg-info' : 'bg-secondary'}`}>
                      {reportStatus.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  {reportDetails.description && (
                    <div className="mb-2">
                      <strong>Description:</strong>
                      <CardText className="mt-1">{reportDetails.description}</CardText>
                    </div>
                  )}
                  {reportDetails.latitude && reportDetails.longitude && (
                    <div className="mb-2">
                      <strong>Location:</strong>
                      <CardText className="mt-1 small">
                        Lat: {reportDetails.latitude.toFixed(6)}<br />
                        Lng: {reportDetails.longitude.toFixed(6)}
                      </CardText>
                    </div>
                  )}
                  {reportDetails.reject_explanation && (
                    <div className="mb-2">
                      <strong>Reject Reason:</strong>
                      <CardText className="mt-1 text-danger">{reportDetails.reject_explanation}</CardText>
                    </div>
                  )}
                  {reportDetails.assignedExternal !== null && reportDetails.assignedExternal !== undefined && (
                    <div className="mb-2">
                      <strong>External Assignment:</strong>{" "}
                      <span className="badge bg-info">{reportDetails.assignedExternal ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {photos.length > 0 && (
                    <div className="mb-3">
                      <strong>Photos:</strong>
                      <div className="d-flex gap-2 flex-wrap mt-2">
                        {photos.map((photo, index) => (
                          <a 
                            key={photo.id || index}
                            href={SERVER_URL + photo.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="d-block"
                          >
                            <img
                              src={SERVER_URL + photo.link}
                              alt={`Photo ${index + 1}`}
                              style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                cursor: 'pointer' 
                              }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sezione messaggi */}
        <div className="col-md-8 col-lg-9">
          <div
            ref={scrollContainerRef}
            style={{
              height: "calc(100vh - 200px)",
              overflowY: "auto",
              background: "#f8f9fa",
              borderRadius: 8,
              padding: "1rem"
            }}
          >
            {renderMessages()}
          </div>
          {canSend && (
            <form className="mt-3 d-flex gap-2" onSubmit={handleSend}>
              <input
                type="text"
                className="form-control"
                placeholder="Type your message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                disabled={sending}
                maxLength={500}
              />
              <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()} aria-label="Send">
                <FaPaperPlane />
              </button>
            </form>
          )}
          {sendError && <div className="alert alert-danger mt-2">{sendError}</div>}
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
