clean:
	docker stop $$(docker ps -a)
	docker rm $$(docker ps -aq)
	docker container prune -f
