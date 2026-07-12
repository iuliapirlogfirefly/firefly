type Props = {
  message: string;
  type: "success" | "error";
};

export function ActionFeedback({ message, type }: Props) {
  return (
    <p
      className={`text-xs ${type === "success" ? "text-emerald-400" : "text-red-400"}`}
      role="status"
    >
      {message}
    </p>
  );
}
