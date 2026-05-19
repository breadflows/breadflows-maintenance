function breadflows() {
  return {
    player: {
      open: false,
      title: "",
      origin: "",
      embedUrl: ""
    },
    openPlayer(video) {
      this.player = {
        open: true,
        title: video.title,
        origin: video.origin,
        embedUrl: video.embedUrl
      };
    },
    closePlayer() {
      this.player.open = false;
      this.player.embedUrl = "";
    }
  };
}
