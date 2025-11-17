import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../API/API.mjs";

const ConversationsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await API.fetchConversations();
        setConversations(data);
      } catch (err) {
        setError("Unable to load conversations.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
          {conversations.map(conv => (
            <li
              key={conv.id}
              className="list-group-item list-group-item-action"
              style={{ cursor: "pointer" }}
              onClick={() => handleClick(conv.id)}
            >
              <div><strong>Report:</strong> {conv.report?.title || "-"}</div>
              <div><strong>Status:</strong> {conv.report?.status || "-"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ConversationsPage;
