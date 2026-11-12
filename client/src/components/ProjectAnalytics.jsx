
import { useEffect, useState } from "react";
import axios from "axios";

function ProjectAnalytics({ projectId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await axios.get(
          `http://localhost:5000/api/projects/${projectId}/analytics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setAnalytics(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load project analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchAnalytics();
    }
  }, [projectId]);

  if (loading) {
    return <p>Loading contribution analytics...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!analytics) {
    return null;
  }

  const { summary, contributions, recentActivity } = analytics;

  return (
    <section className="project-analytics">
      <h2>Contribution Analytics</h2>

      <div className="analytics-summary">
        <article>
          <h3>{summary.totalMembers}</h3>
          <p>Project Members</p>
        </article>

        <article>
          <h3>{summary.totalNotes}</h3>
          <p>Total Notes</p>
        </article>

        <article>
          <h3>{summary.totalFiles}</h3>
          <p>Files Uploaded</p>
        </article>

        <article>
          <h3>{summary.totalContributions}</h3>
          <p>Total Contributions</p>
        </article>
      </div>

      <h3>Member Contributions</h3>

      {contributions.length === 0 ? (
        <p>No contributions recorded yet.</p>
      ) : (
        <div className="analytics-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Notes Created</th>
                <th>Notes Edited</th>
                <th>Files Uploaded</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {contributions.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                    <br />
                    <small>{member.email}</small>
                  </td>
                  <td>{member.notesCreated}</td>
                  <td>{member.notesLastEdited}</td>
                  <td>{member.filesUploaded}</td>
                  <td>
                    <strong>{member.totalContributions}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Recent Activity</h3>

      {recentActivity.length === 0 ? (
        <div className="recent-activity recent-activity-empty">
          <p>No project activity recorded yet.</p>
        </div>
      ) : (
        <ul className="recent-activity">
          {recentActivity.map((activity, index) => (
            <li
              key={`${activity.type}-${activity.action}-${activity.date}-${index}`}
            >
              <strong>{activity.user?.name || "Unknown user"}</strong>{" "}
              {activity.action === "created"
                ? "created note"
                : activity.action === "edited"
                  ? "edited note"
                  : "uploaded file"}
              {" "}
              <strong>{activity.title}</strong>

              <br />

              <small>
                {new Date(activity.date).toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ProjectAnalytics;
