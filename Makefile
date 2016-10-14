BUILD = index.html
ARCHIVE = archive.zip

$(BUILD): src.js vs.glsl fs.glsl
	bash index.html.sh > $(BUILD)

$(ARCHIVE): $(BUILD)
	zip $@ $^

clean:
	rm -f $(ARCHIVE) $(BUILD)

live: $(BUILD)
	scp $(BUILD) hhsw.de@ssh.strato.de:sites/proto/js13k2016/
