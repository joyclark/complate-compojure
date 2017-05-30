(ns complate-compojure.core
  (:import [complate.experiment Renderer]
           [complate.experiment Stream]
           [java.io OutputStream]
           [java.io OutputStreamWriter])
  (:require [ring.core.protocols :refer [StreamableResponseBody]]))

(def renderer (new Renderer))

(deftype ComplateStream [stream]
  Stream
  (write [this msg] (.write stream msg))
  (writeln [this msg] (.write stream (str msg "\n")))
  (flush [this] (.flush stream)))

(deftype ComplateRingRenderer [view-name model]
  StreamableResponseBody
  (write-body-to-stream [this response output-stream]
    (.render renderer view-name (->ComplateStream (new OutputStreamWriter output-stream)) model)))

(defn response [view-name & model]
  (->ComplateRingRenderer view-name (into-array Object model)))

