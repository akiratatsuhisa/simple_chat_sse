import { FormEvent, useCallback, useEffect, useRef } from "react";
import { useCachedState } from "./useCachedState";

interface Info {
  name: string;
  room: number;
}

interface Dto {
  name: string;
  message: string;
  timestamp: number;
}

const BASE_URL = import.meta.env.VITE_BASE_URL;

function Welcome({ onSubmit }: { onSubmit(values: Info): void }) {
  const onSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const usernameInput = event.currentTarget.elements.namedItem(
      "username"
    ) as HTMLInputElement;
    const username = usernameInput.value;

    const roomInput = event.currentTarget.elements.namedItem(
      "room"
    ) as HTMLInputElement;
    const room = roomInput.valueAsNumber;

    if (Number.isNaN(room) || !username.trim()) {
      return;
    }

    onSubmit({ name: username, room });
  };

  return (
    <div className="mx-auto md:w-2/3 lg:w-1/3 shadow-lg rounded-xl p-4 bg-white">
      <form onSubmit={onSubmitForm}>
        <input
          name="username"
          placeholder="Username"
          type="text"
          className="w-full px-3 py-2 rounded-md  border border-solid border-gray-500 outline-none  focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        />

        <div className="h-3"></div>

        <input
          name="room"
          placeholder="Room number"
          type="number"
          className="w-full px-3 py-2 rounded-md  border border-solid border-gray-500 outline-none  focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        />

        <div className="h-3"></div>

        <button className="px-4 py-2 rounded-md w-full bg-sky-500 text-white ">
          Enter
        </button>
      </form>
    </div>
  );
}

function Room({ name, room }: Info) {
  const divRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useCachedState<Array<Dto>>("messages", []);

  const onSubmitForm = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const messageInput = event.currentTarget.elements.namedItem(
        "message"
      ) as HTMLInputElement;

      const message = messageInput.value;

      if (!message.trim()) {
        return;
      }

      messageInput.value = "";

      const form = new FormData();

      form.append("name", name);
      form.append("message", message);

      const response = await fetch(`${BASE_URL}/${room}/send`, {
        method: "POST",
        body: form,
      });

      if (response.status !== 200) {
        alert("Error");
      }
    },
    [name, room]
  );

  useEffect(() => {
    const eventSource = new EventSource(`${BASE_URL}/${room}/messages`);

    const callback = (event: MessageEvent) => {
      setMessages((messages) => [...messages, JSON.parse(event.data)]);

      if (!divRef.current) {
        return;
      }

      const element = divRef.current;

      const isScrolledToBottom =
        element.scrollHeight - element.scrollTop === element.clientHeight;

      if (!isScrolledToBottom) {
        return;
      }

      setTimeout(() => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: "smooth",
        });
      }, 0);
    };

    eventSource.addEventListener("data", callback);

    return () => {
      eventSource.removeEventListener("data", callback);
    };
  }, [room]);

  return (
    <div className="mx-auto md:w-2/3 lg:w-1/3 shadow-lg rounded-xl p-4 bg-white">
      <div
        className=" px-3 py-2 rounded-md  border border-solid border-gray-500 outline-none min-h-80 max-h-80 overflow-y-auto"
        ref={divRef}
      >
        <div className="flex flex-col h-full content-stretch gap-3">
          {messages.map((message, index) => (
            <div key={index}>
              <div>
                <span className="text-sky-700">Name:</span>{" "}
                <span className="whitespace-pre-line break-words font-bold">
                  {message.name}
                </span>
              </div>

              <div className="italic">
                {new Date(message.timestamp).toLocaleString(undefined, {
                  dateStyle: "long",
                  timeStyle: "long",
                })}
              </div>

              <div className="whitespace-pre-line break-words">
                {message.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-3"></div>

      <form onSubmit={onSubmitForm}>
        <input
          name="message"
          type="text"
          className="w-full px-3 py-2 rounded-md  border border-solid border-gray-500 outline-none  focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        />

        <div className="h-3"></div>

        <button className="px-4 py-2 rounded-md w-full bg-sky-500 text-white ">
          Send
        </button>
      </form>
    </div>
  );
}

function App() {
  const [info, setInfo] = useCachedState<Info>("user-info");

  return (
    <div className="p-4 min-h-dvh bg-slate-50">
      <div className="container mx-auto md:px-4">
        {info === undefined ? (
          <Welcome onSubmit={(values) => setInfo(values)} />
        ) : (
          <Room
            key={`${info.name}-${info.room}`}
            name={info.name}
            room={info.room}
          />
        )}
      </div>
    </div>
  );
}

export default App;
