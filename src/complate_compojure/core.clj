(ns complate-compojure.core
  (:import [complate ScriptingBridge]
           [java.io OutputStream])
  (:require [ring.core.protocols :refer [StreamableResponseBody]]
            [ring.adapter.jetty :as jetty]
            [complate-compojure.handler :refer [app]]))

(def engine (new ScriptingBridge))

(defprotocol Renderer 
  (render [this stream]))

(defrecord ComplateRenderer [file-name fn-name args]
  Renderer
  (render [this stream]
    (.invoke engine file-name fn-name stream (into-array args))))

(defn response [file-name fn-name args]
  (->ComplateRenderer file-name fn-name args))

(extend-type ring.core.protocols.StreamableResponseBody
  Renderer
  ;; TODO Implement
  (write-body-to-stream [renderer response output-stream]))

(defn -main []
  (jetty/run-jetty app {:port 3030}))
