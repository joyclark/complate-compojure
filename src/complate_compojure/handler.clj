(ns complate-compojure.handler
  (:require [complate-compojure.core :refer [response]]
            [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.adapter.jetty :as jetty]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]))

(defrecord Product [id name price])

(defroutes app-routes
  (GET "/" [] {:headers {"Content-Type" "text/html; charset=UTF-8"}
               :body (response "index")})
  (GET "/article" [] {:headers {"Content-Type" "text/html; charset=UTF-8"}
                      :body (response "article"
                                      "FND" "JSX on the JVM" "lorem ipsum dolor sit amet")})
  (GET "/products" [] {:headers {"Content-Type" "text/html; charset=UTF-8"}
                       :body (response "products"
                                       [(->Product 123 "toothpaste" 4711),
                                        (->Product 456 "pencil"       42),
                                        (->Product 789 "soup"          1)])})
  (route/not-found "Not Found"))

(def app
  (wrap-defaults app-routes site-defaults))

(defn -main []
  (jetty/run-jetty app {:port 3030}))
