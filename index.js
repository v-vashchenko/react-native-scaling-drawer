import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
  Platform
} from 'react-native';
const { width, height } = Dimensions.get('window');

class SwipeAbleDrawer extends Component {
  static defaultProps = {
    scalingFactor: 0.5,
    minimizeFactor: 0.5,
    swipeOffset: 10,
  };

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      dims: Dimensions.get("window"),
    };
    if (this.props.position === 'right') {
      this.isPositionRight = true
    } else if (this.props.position === 'left') {
      this.isPositionRight = false
    }
    this.isBlockDrawer = false;
    this.translateX = 0;
    this.scale = 1;
    this.maxTranslateXValue = (-1) ** this.isPositionRight * Math.ceil(this.state.dims.width * props.minimizeFactor);
    this.drawerAnimation = new Animated.Value(0);
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._onStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._onMoveShouldSetPanResponder,
      onPanResponderMove: this._onPanResponderMove,
      onPanResponderRelease: this._onPanResponderRelease
    });
    Dimensions.addEventListener("change", this.dimhandler);
  }

  dimhandler = dims => this.setState({ dims: dims.window });

  blockSwipeAbleDrawer = (isBlock) => {
    this.isBlockDrawer = isBlock;
  };

  _onStartShouldSetPanResponder = (e, gestureState) => {
    if (this.state.isOpen) {
      this.scale = this.props.scalingFactor;
      this.translateX = this.maxTranslateXValue;
      this.setState({ isOpen: false }, () => {
        this.props.onClose && this.props.onClose();
        this.onDrawerAnimation()
      });
    }
  };
  _onMoveShouldSetPanResponder = (e, { dx, dy, moveX }) => {
    if (!this.isBlockDrawer) {
      if (this.isPositionRight) {
        return ((Math.abs(dx) > Math.abs(dy)
          && dx < 20 && moveX > this.state.dims.width - this.props.swipeOffset) || this.state.isOpen);
      } else {
        return ((Math.abs(dx) > Math.abs(dy)
          && dx < 20 && moveX < this.props.swipeOffset) || this.state.isOpen);
      }
    }
    return false;
  };
  _onPanResponderMove = (e, { dx }) => {
    if (!this.state.isOpen) {
      if ((-1) ** this.isPositionRight * dx < 0) return false;
      if (Math.abs(Math.round(dx)) < Math.abs(this.maxTranslateXValue)) {
        this.translateX = Math.round(dx);
        this.scale = 1 - ((this.translateX * (1 - this.props.scalingFactor)) / this.maxTranslateXValue);

        this.frontRef.setNativeProps({
          style: {
            transform: [{ translateX: this.translateX },
            { scale: this.scale }],
            opacity: this.opacity
          }
        });
        Animated.event([
          null, { dx: this.drawerAnimation }
        ]);
      }
    }
  };

  _onPanResponderRelease = (e, { dx }) => {
    if ((-1) ** this.isPositionRight * dx < 0 && !this.state.isOpen) return false;
    if ((-1) ** this.isPositionRight * dx > this.state.dims.width * 0.1) {
      this.setState({ isOpen: true }, () => {
        this.scale = this.props.scalingFactor;
        this.translateX = this.maxTranslateXValue;
        this.props.onOpen && this.props.onOpen();
      });
      this.onDrawerAnimation();
    } else {
      this.setState({ isOpen: false }, () => {
        this.scale = 1;
        this.translateX = 0;
        this.props.onClose && this.props.onClose();
      });
      this.onDrawerAnimation();
    }
  };

  onDrawerAnimation() {
    this.drawerAnimation.setValue(0);
    Animated.timing(
      this.drawerAnimation,
      {
        toValue: 1,
        duration: this.props.duration || 250,
        Easing: Easing.linear
      }
    ).start();
  }


  animationInterpolate() {
    return this.state.isOpen ?
      {
        translateX: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.translateX, this.maxTranslateXValue],
          extrapolate: 'clamp'
        }),
        scale: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.scale, this.props.scalingFactor],
          extrapolate: 'clamp'
        })
      }
      : {
        translateX: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.translateX, 0],
          extrapolate: 'clamp'
        }),
        scale: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.scale, 1],
          extrapolate: 'clamp'
        })
      }
  }

  close = () => {
    this.scale = this.props.scalingFactor;
    this.translateX = this.maxTranslateXValue;
    this.setState({ isOpen: false }, () => {
      this.onDrawerAnimation();
      this.props.onClose && this.props.onClose();
    });
  };

  open = () => {
    this.scale = 1;
    this.translateX = 0;
    this.setState({ isOpen: true }, () => {
      this.props.onOpen && this.props.onOpen();
      this.onDrawerAnimation()
    })
  };

  isOpen = () => {
    return this.state.isOpen;
  };

  render() {
    const translateX = this.animationInterpolate().translateX;
    const firstTranslateX = this.animationInterpolate().translateX;
    const secondTranslateX = this.animationInterpolate().translateX;
    const scale = this.animationInterpolate().scale;

    return (
      <View style={styles.container}>
        <Animated.View
          {...this.panResponder.panHandlers}
          ref={ref => this.frontRef = ref}
          style={[styles.front, {
            height: this.state.dims.height,
            borderRadius: 15,
            paddingLeft: Platform.OS === 'android' && this.state.isOpen ? 13 : 0,
            paddingBottom: Platform.OS === 'android' && this.state.isOpen ? 5 : 0,
            transform: [{ translateX }, { scale }]
          },
          this.props.frontStyle
          ]
          }
        >
          {this.props.children}
          {this.state.isOpen && <View style={styles.mask} />}
        </Animated.View>

        <Animated.View
          style={[styles.front, {
            backgroundColor: 'white',
            height: this.state.dims.height - 80,
            width: 1000,
            position: 'absolute',
            zIndex: 2,
            left: -105,
            top: 40,
            opacity: 0.5,
            borderRadius: 15,
            transform: [{ translateX: firstTranslateX }, { scale }]
          }]}
        />
        <Animated.View
          style={[styles.front, {
            backgroundColor: 'white',
            height: this.state.dims.height - 160,
            width: 1000,
            position: 'absolute',
            zIndex: 2,
            left: -115,
            top: 80,
            opacity: 0.2,
            borderRadius: 15,
            transform: [{ translateX: secondTranslateX }, { scale }]
          }]}
        />
        <View style={[styles.drawer, this.props.contentWrapperStyle, { height: this.state.dims.height, width: this.state.dims.width }]}>
          {this.props.content}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dedede',
    borderRadius: 15
  },
  drawer: {
    position: "absolute",
    top: 0,
    zIndex: 1
  },
  front: {
    backgroundColor: "white",
    zIndex: 3,
  },
  mask: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: "transparent"
  },
});

const floatRange = (props, propName, componentName) => {
  if (props[propName] < 0.1 || props[propName] >= 1) {
    return new Error(
      `Invalid prop ${propName} supplied to ${componentName}. ${propName} must be between 0.1 and 1.0`
    )
  }
};

SwipeAbleDrawer.propTypes = {
  scalingFactor: floatRange,
  minimizeFactor: floatRange,
  swipeOffset: PropTypes.number,
  position: PropTypes.oneOf(['right', 'left']),
  contentWrapperStyle: PropTypes.object,
  frontStyle: PropTypes.object,
};
SwipeAbleDrawer.defaultProps = {
  position: 'left'
};
export default SwipeAbleDrawer;
