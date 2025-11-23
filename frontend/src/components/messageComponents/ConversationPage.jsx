import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../../API/API.mjs";
import { isSameDay, format, parseISO } from "date-fns";
import { FaPaperPlane } from "react-icons/fa";
const ConversationPage = ({ user, handleNotificationsUpdate, wsMessage }) => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const scrollContainerRef = useRef(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

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
        } else {
          const convs = await API.fetchConversations();
          const conv = convs.find(c => String(c.id) === String(conversationId));
          setReportTitle(conv?.report?.title || "Messages");
          setReportStatus(conv?.report?.status || "");
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
    <div className="container mt-4" style={{ maxWidth: 1200 }}>
      <h2 className="mb-3 text-center">{reportTitle || "Messages"}</h2>
      <div
        ref={scrollContainerRef}
        style={{
          maxHeight: "60vh",
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
  );
};

export default ConversationPage;
